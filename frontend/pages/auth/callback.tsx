import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { saveToken } from '../../lib/api/auth';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthCallback() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  useEffect(() => {
    if (!router.isReady) return;

    const { token } = router.query;

    if (token && typeof token === 'string') {
      saveToken(token);
      refreshUser()
        .then(() => {
          router.push('/').catch(() => {
            // 라우터 취소 오류 무시
          });
        })
        .catch(() => {
          // 에러 발생 시에도 홈으로 이동
          router.push('/').catch(() => {});
        });
    } else {
      router.push('/').catch(() => {
        // 라우터 취소 오류 무시
      });
    }
  }, [router.isReady, router.query, router, refreshUser]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p>로그인 처리 중...</p>
    </div>
  );
}

