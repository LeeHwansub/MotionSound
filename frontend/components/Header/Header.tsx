import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';

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
            gap: '1.5rem',
          }}
        >
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              color: router.pathname === '/' ? '#2563eb' : '#6b7280',
              fontWeight: router.pathname === '/' ? '600' : '400',
              fontSize: '16px',
              transition: 'color 0.2s',
            }}
          >
            홈
          </Link>
          <Link
            href="/community"
            style={{
              textDecoration: 'none',
              color: router.pathname.startsWith('/community') ? '#2563eb' : '#6b7280',
              fontWeight: router.pathname.startsWith('/community') ? '600' : '400',
              fontSize: '16px',
              transition: 'color 0.2s',
            }}
          >
            커뮤니티
          </Link>

          {!authLoading && (
            isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    padding: '6px 12px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '6px',
                  }}
                >
                  {user?.name || user?.email}
                </span>
                <button
                  onClick={logout}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
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
                  borderRadius: '6px',
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

