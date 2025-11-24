import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { updateCurrentUser, uploadProfileImage, getToken, sendOtp, verifyOtp } from '../lib/api/auth';
import { getProxiedMediaUrl } from '../lib/api/videos';
import { Header } from '../components/Header/Header';
import { extractErrorMessage } from '../lib/api/error-handler';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading, refreshUser } = useAuth();
  const { showError, showSuccess } = useToast();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'prefer_not_to_say' | ''>('');
  const [birthDate, setBirthDate] = useState('');
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [verifiedPhoneNumber, setVerifiedPhoneNumber] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhoneNumber(user.phoneNumber || '');
      setGender(user.gender || '');
      if (user.birthDate) {
        const date = new Date(user.birthDate);
        setBirthDate(date.toISOString().split('T')[0]);
      }
      if (user.profileImage) {
        setProfileImagePreview(getProxiedMediaUrl(user.profileImage));
      }
      if (user.phoneNumber) {
        setVerifiedPhoneNumber(user.phoneNumber);
      }
    }
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showError('이미지 파일만 업로드 가능합니다.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showError('이미지 파일 크기는 5MB 이하여야 합니다.');
        return;
      }
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!profileImageFile) return;

    const token = getToken();
    if (!token) {
      showError('인증 토큰이 없습니다. 다시 로그인해주세요.');
      router.push('/login');
      return;
    }

    setIsUploadingImage(true);

    try {
      await uploadProfileImage(token, profileImageFile);
      setProfileImageFile(null);
      showSuccess('프로필 사진이 업로드되었습니다.');
      await refreshUser();
    } catch (err) {
      console.error('프로필 사진 업로드 실패:', err);
      showError(extractErrorMessage(err));
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showError('이름을 입력해주세요.');
      return;
    }

    if (phoneNumber && !/^[0-9]{10,11}$/.test(phoneNumber)) {
      showError('핸드폰 번호는 10-11자리 숫자여야 합니다.');
      return;
    }

    if (phoneNumber && verifiedPhoneNumber && phoneNumber !== verifiedPhoneNumber) {
      showError('인증되지 않은 전화번호로는 변경할 수 없습니다. 먼저 SMS 인증을 완료해주세요.');
      return;
    }

    const token = getToken();
    if (!token) {
      showError('인증 토큰이 없습니다. 다시 로그인해주세요.');
      router.push('/login');
      return;
    }

    setIsSaving(true);

    try {
      if (profileImageFile) {
        try {
          await uploadProfileImage(token, profileImageFile);
          setProfileImageFile(null);
              } catch (uploadErr) {
                console.error('프로필 사진 업로드 실패:', uploadErr);
                showError(extractErrorMessage(uploadErr));
                setIsSaving(false);
                return;
              }
      }

      const updateData: any = {
        name: name.trim(),
        gender: gender || undefined,
        birthDate: birthDate || undefined,
      };

      if (phoneNumber.trim()) {
        if (verifiedPhoneNumber && phoneNumber !== verifiedPhoneNumber) {
          showError('인증되지 않은 전화번호로는 변경할 수 없습니다. 먼저 SMS 인증을 완료해주세요.');
          setIsSaving(false);
          return;
        }
        if (verifiedPhoneNumber && phoneNumber === verifiedPhoneNumber) {
          updateData.phoneNumber = phoneNumber.trim();
        } else if (!verifiedPhoneNumber && user && user.phoneNumber && phoneNumber !== user.phoneNumber) {
          showError('인증되지 않은 전화번호로는 변경할 수 없습니다. 먼저 SMS 인증을 완료해주세요.');
          setIsSaving(false);
          return;
        } else if (!user || !user.phoneNumber || phoneNumber === user.phoneNumber) {
          updateData.phoneNumber = phoneNumber.trim();
        }
      }

      await updateCurrentUser(token, updateData);
      showSuccess('프로필이 업데이트되었습니다.');
      await refreshUser();
    } catch (err) {
      console.error('프로필 업데이트 실패:', err);
      showError(extractErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>프로필 - Motion Sound</title>
        </Head>
        <Header />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>로딩 중...</p>
        </div>
      </>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>프로필 - Motion Sound</title>
      </Head>
      <Header />
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '2rem',
        }}
      >

        <h1 style={{ fontSize: '2rem', marginBottom: '2rem', color: '#111827' }}>
          프로필
        </h1>

        <div
          style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{ marginBottom: '2rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: '#374151',
              }}
            >
              프로필 사진
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  backgroundColor: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  border: '2px solid #e5e7eb',
                }}
              >
                {profileImagePreview ? (
                  <img
                    src={profileImagePreview}
                    alt="프로필"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <span style={{ color: '#9ca3af', fontSize: '2rem' }}>👤</span>
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: isUploadingImage ? 'not-allowed' : 'pointer',
                    marginBottom: '0.5rem',
                    display: 'block',
                  }}
                >
                  사진 선택
                </button>
                {profileImageFile && (
                  <button
                    type="button"
                    onClick={handleImageUpload}
                    disabled={isUploadingImage}
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isUploadingImage ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isUploadingImage ? '업로드 중...' : '업로드'}
                  </button>
                )}
              </div>
            </div>
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
              최대 5MB, JPG, PNG, GIF 형식
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151',
                }}
              >
                이메일
              </label>
              <input
                type="email"
                id="email"
                value={user.email}
                disabled
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb',
                  color: '#6b7280',
                  fontSize: '1rem',
                }}
              />
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                이메일은 변경할 수 없습니다.
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="name"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151',
                }}
              >
                이름
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력하세요"
                maxLength={50}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="phoneNumber"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151',
                }}
              >
                핸드폰 번호
                {user.phoneNumber && (
                  <span
                    style={{
                      marginLeft: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#10b981',
                      fontWeight: '400',
                    }}
                  >
                    ✓ 인증됨
                  </span>
                )}
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => {
                    const newPhoneNumber = e.target.value.replace(/[^0-9]/g, '');
                    setPhoneNumber(newPhoneNumber);
                    if (newPhoneNumber !== verifiedPhoneNumber) {
                      setShowOtpInput(false);
                      setOtp('');
                    }
                  }}
                  placeholder="01012345678"
                  maxLength={11}
                  disabled={isVerifyingPhone}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    backgroundColor: isVerifyingPhone ? '#f9fafb' : 'white',
                  }}
                />
                {phoneNumber && phoneNumber.length >= 10 && !showOtpInput && (
                  <button
                    type="button"
                    onClick={async () => {
                      const token = getToken();
                      if (!token) {
                        showError('인증 토큰이 없습니다. 다시 로그인해주세요.');
                        return;
                      }

                      setIsSendingOtp(true);

                      try {
                        await sendOtp(token, { phoneNumber });
                        setShowOtpInput(true);
                        showSuccess('인증번호가 전송되었습니다.');
                      } catch (err) {
                        console.error('인증번호 전송 실패:', err);
                        showError(extractErrorMessage(err));
                      } finally {
                        setIsSendingOtp(false);
                      }
                    }}
                    disabled={isSendingOtp || isVerifyingPhone}
                    style={{
                      padding: '0.75rem 1rem',
                      fontSize: '0.875rem',
                      backgroundColor: isSendingOtp ? '#9ca3af' : '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: isSendingOtp ? 'not-allowed' : 'pointer',
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isSendingOtp ? '전송 중...' : '인증번호 전송'}
                  </button>
                )}
              </div>
              {showOtpInput && (
                <div style={{ marginTop: '0.75rem' }}>
                  <label
                    htmlFor="otp"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                    }}
                  >
                    인증번호
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      id="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                      placeholder="6자리 숫자"
                      maxLength={6}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        textAlign: 'center',
                        letterSpacing: '0.5rem',
                      }}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (otp.length !== 6) {
                          showError('인증번호 6자리를 입력해주세요.');
                          return;
                        }

                        const token = getToken();
                        if (!token) {
                          showError('인증 토큰이 없습니다. 다시 로그인해주세요.');
                          return;
                        }

                        setIsVerifyingOtp(true);

                        try {
                          const result = await verifyOtp(token, { phoneNumber, otp });
                          setShowOtpInput(false);
                          setOtp('');
                          setIsVerifyingPhone(false);
                          if (result.user?.phoneNumber) {
                            setVerifiedPhoneNumber(result.user.phoneNumber);
                            setPhoneNumber(result.user.phoneNumber);
                          } else {
                          setVerifiedPhoneNumber(phoneNumber);
                          setPhoneNumber(phoneNumber);
                          }
                          showSuccess('핸드폰 번호가 인증되었습니다.');
                          await refreshUser();
                        } catch (err) {
                          console.error('인증번호 검증 실패:', err);
                          showError(extractErrorMessage(err));
                        } finally {
                          setIsVerifyingOtp(false);
                        }
                      }}
                      disabled={isVerifyingOtp || otp.length !== 6}
                      style={{
                        padding: '0.75rem 1rem',
                        fontSize: '0.875rem',
                        backgroundColor: isVerifyingOtp || otp.length !== 6 ? '#9ca3af' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: isVerifyingOtp || otp.length !== 6 ? 'not-allowed' : 'pointer',
                        fontWeight: '500',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isVerifyingOtp ? '인증 중...' : '인증'}
                    </button>
                  </div>
                </div>
              )}
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                10-11자리 숫자만 입력 가능합니다. 인증번호는 5분간 유효합니다.
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="gender"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151',
                }}
              >
                성별
              </label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  backgroundColor: 'white',
                }}
              >
                <option value="">선택 안 함</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="other">기타</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="birthDate"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151',
                }}
              >
                생일
              </label>
              <input
                type="date"
                id="birthDate"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                backgroundColor: isSaving || !name.trim() ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: isSaving || !name.trim() ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              {isSaving ? '저장 중...' : '저장'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
