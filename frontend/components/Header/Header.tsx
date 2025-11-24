import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import { getProxiedMediaUrl } from '../../lib/api/videos';

export function Header() {
  const router = useRouter();
  const { user, isAuthenticated, login, logout, loading: authLoading } = useAuth();

  return (
    <header
      style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="Motion Sound Logo"
            style={{
              width: '40px',
              height: '40px',
            }}
          />
          <span
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Motion Sound
          </span>
        </Link>

        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link
              href="/"
              style={{
                textDecoration: 'none',
                color: router.pathname === '/' ? '#2563eb' : '#6b7280',
                fontWeight: router.pathname === '/' ? '600' : '400',
                fontSize: '16px',
                transition: 'all 0.2s',
                padding: '8px 12px',
                borderRadius: '8px',
              }}
            >
              홈
            </Link>
            <Link
              href="/motion-capture"
              style={{
                textDecoration: 'none',
                color: router.pathname === '/motion-capture' ? '#2563eb' : '#6b7280',
                fontWeight: router.pathname === '/motion-capture' ? '600' : '400',
                fontSize: '16px',
                transition: 'all 0.2s',
                padding: '8px 12px',
                borderRadius: '8px',
              }}
            >
              모션 캡처
            </Link>
            <Link
              href="/community"
              style={{
                textDecoration: 'none',
                color: router.pathname.startsWith('/community') ? '#2563eb' : '#6b7280',
                fontWeight: router.pathname.startsWith('/community') ? '600' : '400',
                fontSize: '16px',
                transition: 'all 0.2s',
                padding: '8px 12px',
                borderRadius: '8px',
              }}
            >
              커뮤니티
            </Link>
          </div>

          {!authLoading && (
            isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link
                  href="/profile"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    textDecoration: 'none',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    transition: 'all 0.2s',
                  }}
                >
                  {user?.profileImage ? (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '2px solid #e5e7eb',
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={getProxiedMediaUrl(user.profileImage)}
                        alt="프로필"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ color: '#9ca3af', fontSize: '16px' }}>👤</span>
                    </div>
                  )}
                  <span
                    style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      fontWeight: router.pathname === '/profile' ? '600' : '400',
                    }}
                  >
                    {user?.name || user?.email}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ef4444';
                  }}
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <button
                onClick={() => router.push('/login')}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1d4ed8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }}
              >
                로그인
              </button>
            )
          )}
        </nav>
      </div>
    </header>
  );
}

