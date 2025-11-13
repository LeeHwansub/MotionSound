import Head from 'next/head';
import { useState } from 'react';
import { MotionCapture } from '../components/MotionRecognition/MotionCapture';
import { MotionVisualizer } from '../components/MotionRecognition/MotionVisualizer';
import { MotionData } from '../hooks/useMotionRecognition';

export default function Home() {
  const [motionData, setMotionData] = useState<MotionData | null>(null);

  return (
    <>
      <Head>
        <title>Motion Sound - 모션 인식 프로토타입</title>
        <meta name="description" content="움직임이 곧 음악이 되는 시스템" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main
        style={{
          minHeight: '100vh',
          padding: '24px',
          backgroundColor: '#f9fafb',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          {/* 헤더 */}
          <header style={{ marginBottom: '32px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '32px', marginBottom: '8px', color: '#111827' }}>
              Motion Sound
            </h1>
            <p style={{ fontSize: '16px', color: '#6b7280' }}>
              움직임이 곧 음악이 되는 시스템 - 모션 인식 프로토타입
            </p>
          </header>

          {/* 메인 컨텐츠 영역 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              marginBottom: '24px',
            }}
          >
            {/* 모션 캡처 영역 */}
            <div
              style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              }}
            >
              <h2 style={{ fontSize: '20px', marginBottom: '16px', color: '#111827' }}>
                모션 캡처
              </h2>
              <MotionCapture
                autoStart={false}
                showVideo={true}
                onMotionData={setMotionData}
              />
            </div>

            {/* 모션 시각화 영역 */}
            <div
              style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              }}
            >
              <h2 style={{ fontSize: '20px', marginBottom: '16px', color: '#111827' }}>
                모션 시각화
              </h2>
              <MotionVisualizer motionData={motionData} width={640} height={480} />
            </div>
          </div>

          {/* 모션 데이터 디버그 영역 */}
          {motionData && (
            <div
              style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              }}
            >
              <h2 style={{ fontSize: '20px', marginBottom: '16px', color: '#111827' }}>
                모션 데이터 (디버그)
              </h2>
              <div
                style={{
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  backgroundColor: '#f3f4f6',
                  padding: '16px',
                  borderRadius: '8px',
                  overflow: 'auto',
                  maxHeight: '300px',
                }}
              >
                <pre>{JSON.stringify(motionData, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}