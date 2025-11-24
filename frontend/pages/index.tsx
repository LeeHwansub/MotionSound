import Head from 'next/head';
import { useRouter } from 'next/router';
import { Header } from '../components/Header/Header';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Motion Sound - 몸의 움직임이 바로 악보가 되는 세상</title>
        <meta name="description" content="Motion Sound는 단순한 모션 인식 기술이 아니라, 사용자의 제스처를 예술로 번역하는 인터랙티브 사운드 플랫폼입니다." />
      </Head>
      <Header />
      
      <main style={{ backgroundColor: '#ffffff' }}>
        <section
          style={{
            position: 'relative',
            minHeight: 'calc(100vh - 80px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)',
            padding: '0',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 30% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
            }}
          />
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              maxWidth: '1400px',
              width: '100%',
              padding: '4rem 2rem',
              textAlign: 'center',
              color: 'white',
            }}
          >
            <div
              style={{
                marginBottom: '2rem',
                animation: 'fadeInUp 0.8s ease-out',
              }}
            >
              <h1
                style={{
                  fontSize: 'clamp(3rem, 8vw, 5.5rem)',
                  fontWeight: '800',
                  marginBottom: '1.5rem',
                  lineHeight: '1.1',
                  letterSpacing: '-0.02em',
                  textShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                }}
              >
                몸의 움직임이
                <br />
                바로 악보가 되는 세상
              </h1>
              <p
                style={{
                  fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)',
                  marginBottom: '3rem',
                  lineHeight: '1.6',
                  maxWidth: '800px',
                  margin: '0 auto 3rem',
                  opacity: 0.95,
                  fontWeight: '300',
                }}
              >
                카메라 하나만 있으면 누구나 몸으로 연주할 수 있습니다.
                <br />
                AI가 움직임을 해석해 음으로 바꾸는 예술과 기술의 접점을 경험하세요.
              </p>
            </div>
            <div
              style={{
                display: 'flex',
                gap: '1.5rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginBottom: '4rem',
              }}
            >
              <Link
                href="/motion-capture"
                style={{
                  display: 'inline-block',
                  padding: '1.25rem 3rem',
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  backgroundColor: 'white',
                  color: '#1e3a8a',
                  borderRadius: '50px',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
                }}
              >
                시작하기
              </Link>
              <Link
                href="/community"
                style={{
                  display: 'inline-block',
                  padding: '1.25rem 3rem',
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  backgroundColor: 'transparent',
                  color: 'white',
                  border: '2px solid white',
                  borderRadius: '50px',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.backdropFilter = 'blur(10px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.backdropFilter = 'none';
                }}
              >
                커뮤니티 둘러보기
              </Link>
            </div>
            <div
              style={{
                marginTop: '6rem',
                fontSize: '1rem',
                opacity: 0.8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <span>SCROLL DOWN</span>
              <span style={{ fontSize: '1.5rem' }}>↓</span>
            </div>
          </div>
        </section>

        <section
          style={{
            padding: '8rem 2rem',
            backgroundColor: '#ffffff',
          }}
        >
          <div
            style={{
              maxWidth: '1400px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                marginBottom: '5rem',
              }}
            >
              <h2
                style={{
                  fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                  fontWeight: '700',
                  color: '#1a202c',
                  marginBottom: '1rem',
                  letterSpacing: '-0.02em',
                }}
              >
                주요 기능
              </h2>
              <p
                style={{
                  fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                  color: '#64748b',
                  maxWidth: '600px',
                  margin: '0 auto',
                  lineHeight: '1.6',
                }}
              >
                Motion Sound의 핵심 기능을 소개합니다
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '2.5rem',
              }}
            >
              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: '3rem 2.5rem',
                  borderRadius: '20px',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.4s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '2rem',
                    fontSize: '2.5rem',
                    boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)',
                  }}
                >
                  🎵
                </div>
                <h3
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: '700',
                    color: '#1a202c',
                    marginBottom: '1rem',
                  }}
                >
                  실시간 모션 인식
                </h3>
                <p
                  style={{
                    color: '#64748b',
                    lineHeight: '1.8',
                    fontSize: '1rem',
                  }}
                >
                  MediaPipe를 활용한 손, 팔, 상체, 얼굴의 움직임을 초당 30fps로 실시간 인식합니다.
                </p>
              </div>

              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: '3rem 2.5rem',
                  borderRadius: '20px',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.4s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '2rem',
                    fontSize: '2.5rem',
                    boxShadow: '0 8px 16px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  🎹
                </div>
                <h3
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: '700',
                    color: '#1a202c',
                    marginBottom: '1rem',
                  }}
                >
                  모션 → 사운드 매핑
                </h3>
                <p
                  style={{
                    color: '#64748b',
                    lineHeight: '1.8',
                    fontSize: '1rem',
                  }}
                >
                  Y축 위치는 음정으로, 이동 속도는 볼륨으로 변환되어 자연스러운 음악을 만들어냅니다.
                </p>
              </div>

              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: '3rem 2.5rem',
                  borderRadius: '20px',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.4s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '2rem',
                    fontSize: '2.5rem',
                    boxShadow: '0 8px 16px rgba(139, 92, 246, 0.3)',
                  }}
                >
                  🎬
                </div>
                <h3
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: '700',
                    color: '#1a202c',
                    marginBottom: '1rem',
                  }}
                >
                  비디오 녹화 및 편집
                </h3>
                <p
                  style={{
                    color: '#64748b',
                    lineHeight: '1.8',
                    fontSize: '1rem',
                  }}
                >
                  모션 인식 영상을 녹화하고 편집하여 커뮤니티에 공유할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            padding: '8rem 2rem',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          }}
        >
          <div
            style={{
              maxWidth: '1400px',
              margin: '0 auto',
              textAlign: 'center',
            }}
          >
            <h2
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                fontWeight: '700',
                color: '#1a202c',
                marginBottom: '1.5rem',
                letterSpacing: '-0.02em',
              }}
            >
              지금 바로 시작하세요
            </h2>
            <p
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                color: '#64748b',
                marginBottom: '3rem',
                maxWidth: '600px',
                margin: '0 auto 3rem',
                lineHeight: '1.6',
              }}
            >
              설치 없이 브라우저에서 바로 사용할 수 있습니다
            </p>
            <Link
              href="/motion-capture"
              style={{
                display: 'inline-block',
                padding: '1.25rem 3rem',
                fontSize: '1.125rem',
                fontWeight: '600',
                backgroundColor: '#2563eb',
                color: 'white',
                borderRadius: '50px',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1d4ed8';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(37, 99, 235, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.3)';
              }}
            >
              모션 캡처 시작하기
            </Link>
          </div>
        </section>
      </main>

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
