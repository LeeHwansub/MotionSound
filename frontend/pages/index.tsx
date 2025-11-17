import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { MotionCapture } from '../components/MotionRecognition/MotionCapture';
import { MotionVisualizer } from '../components/MotionRecognition/MotionVisualizer';
import { MotionData } from '../hooks/useMotionRecognition';
import { useSoundMapping } from '../hooks/useSoundMapping';
import { useMotionPattern } from '../hooks/useMotionPattern';
import { Note, NOTE_NAMES, OCTAVE_RANGE, getNoteFrequency, DEFAULT_NOTE } from '../lib/musicalNotes';
import { AudioEngine } from '../lib/audio';
import { MotionPattern } from '../lib/motionPattern';

export default function Home() {
  const [motionData, setMotionData] = useState<MotionData | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note>(DEFAULT_NOTE);
  const [recordingName, setRecordingName] = useState('');
  const [recordingNote, setRecordingNote] = useState<Note | null>(null);
  const [audioFileUrl, setAudioFileUrl] = useState<string>('');
  
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const [audioEngineInitialized, setAudioEngineInitialized] = useState(false);
  
  const { isInitialized, initialize, updateMotion, stop } = useSoundMapping({
    enabled: soundEnabled,
    baseNote: selectedNote,
    minVolume: 0.1,
    maxVolume: 0.5,
  });

  const {
    patterns,
    isRecording,
    recordingSamples,
    matchedPattern,
    startRecording,
    stopRecording,
    deletePatternById,
    loadPatterns,
  } = useMotionPattern(motionData, audioEngineRef.current, {
    threshold: 0.3,
    checkInterval: 100,
  });

  useEffect(() => {
    const initAudioEngine = async () => {
      try {
        const engine = new AudioEngine();
        await engine.initialize();
        audioEngineRef.current = engine;
        setAudioEngineInitialized(true);
      } catch (error) {
        console.error('AudioEngine 초기화 실패:', error);
      }
    };
    initAudioEngine();
  }, []);

  useEffect(() => {
    if (motionData && soundEnabled && isInitialized) {
      updateMotion(motionData);
    }
  }, [motionData, soundEnabled, isInitialized, updateMotion]);

  const handleInitializeSound = async () => {
    try {
      await initialize();
      setSoundEnabled(true);
    } catch (error) {
      console.error('사운드 초기화 실패:', error);
      alert('사운드를 초기화할 수 없습니다. 브라우저가 오디오를 지원하는지 확인해주세요.');
    }
  };

  const handleStopSound = () => {
    stop();
    setSoundEnabled(false);
  };

  const handleStartRecording = () => {
    if (!recordingName.trim()) {
      alert('모션 패턴 이름을 입력해주세요.');
      return;
    }
    startRecording(recordingName, recordingNote || undefined);
  };

  const handleStopRecording = () => {
    const pattern = stopRecording(audioFileUrl || undefined);
    if (pattern) {
      setRecordingName('');
      setRecordingNote(null);
      setAudioFileUrl('');
      alert(`모션 패턴 "${pattern.name}"이 저장되었습니다.`);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioFileUrl(url);
    }
  };

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

          {/* 모션 패턴 캡처 영역 */}
          <div
            style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              marginBottom: '24px',
            }}
          >
            <h2 style={{ fontSize: '20px', marginBottom: '16px', color: '#111827' }}>
              모션 패턴 캡처
            </h2>
            
            {!isRecording ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    모션 패턴 이름
                  </label>
                  <input
                    type="text"
                    value={recordingName}
                    onChange={(e) => setRecordingName(e.target.value)}
                    placeholder="예: 손 흔들기, 팔 올리기"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    기준 음표 (선택사항 - 실시간 피치 제어용)
                  </label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                      value={recordingNote?.name || ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          const octave = recordingNote?.octave || 4;
                          setRecordingNote({
                            name: e.target.value,
                            octave,
                            frequency: getNoteFrequency(e.target.value, octave),
                          });
                        } else {
                          setRecordingNote(null);
                        }
                      }}
                      style={{
                        padding: '8px 12px',
                        fontSize: '14px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">음표 없음</option>
                      {NOTE_NAMES.map((note) => (
                        <option key={note} value={note}>
                          {note}
                        </option>
                      ))}
                    </select>
                    
                    {recordingNote && (
                      <>
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>옥타브</span>
                        <select
                          value={recordingNote.octave}
                          onChange={(e) => {
                            const octave = parseInt(e.target.value);
                            setRecordingNote({
                              ...recordingNote,
                              octave,
                              frequency: getNoteFrequency(recordingNote.name, octave),
                            });
                          }}
                          style={{
                            padding: '8px 12px',
                            fontSize: '14px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                          }}
                        >
                          {OCTAVE_RANGE.map((octave) => (
                            <option key={octave} value={octave}>
                              {octave}
                            </option>
                          ))}
                        </select>
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>
                          ({recordingNote.name}{recordingNote.octave} = {Math.round(recordingNote.frequency)}Hz)
                        </span>
                      </>
                    )}
                  </div>
                  <p style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
                    음표를 선택하면 모션이 매칭되었을 때 실시간으로 피치가 조절됩니다
                  </p>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    음/음악 파일 (선택사항)
                  </label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '14px',
                    }}
                  />
                  <p style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
                    오디오 파일과 음표를 함께 사용할 수 있습니다
                  </p>
                </div>
                
                <button
                  onClick={handleStartRecording}
                  disabled={!recordingName.trim()}
                  style={{
                    padding: '12px 24px',
                    fontSize: '16px',
                    backgroundColor: recordingName.trim() ? '#10b981' : '#9ca3af',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: recordingName.trim() ? 'pointer' : 'not-allowed',
                    fontWeight: '500',
                  }}
                >
                  모션 캡처 시작
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: '#ef4444',
                      animation: 'pulse 1s infinite',
                    }}
                  />
                  <span style={{ fontSize: '16px', fontWeight: '500', color: '#ef4444' }}>
                    캡처 중... ({recordingSamples.length}개 샘플)
                  </span>
                </div>
                <button
                  onClick={handleStopRecording}
                  style={{
                    padding: '12px 24px',
                    fontSize: '16px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  캡처 중지
                </button>
              </div>
            )}

            {matchedPattern && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: '#dbeafe',
                  borderRadius: '6px',
                  border: '1px solid #3b82f6',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e40af' }}>
                  매칭된 모션: {matchedPattern.name}
                </div>
                {matchedPattern.audioUrl && (
                  <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '4px' }}>
                    오디오 재생 중...
                  </div>
                )}
              </div>
            )}

            {patterns.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#111827' }}>
                  저장된 모션 패턴 ({patterns.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {patterns.map((pattern) => (
                    <div
                      key={pattern.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                          {pattern.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {pattern.samples.length}개 샘플
                          {pattern.audioUrl && ' · 오디오 파일 있음'}
                          {pattern.baseNote && ` · 음표: ${pattern.baseNote.name}${pattern.baseNote.octave}`}
                        </div>
                      </div>
                      <button
                        onClick={() => deletePatternById(pattern.id)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 사운드 제어 영역 */}
          <div
            style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              marginBottom: '24px',
            }}
          >
            <h2 style={{ fontSize: '20px', marginBottom: '16px', color: '#111827' }}>
              사운드 제어
            </h2>
            
            {/* 음표 선택 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                기준 음표 선택
              </label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={selectedNote.name}
                  onChange={(e) => {
                    const newNote = {
                      ...selectedNote,
                      name: e.target.value,
                      frequency: getNoteFrequency(e.target.value, selectedNote.octave),
                    };
                    setSelectedNote(newNote);
                  }}
                  style={{
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                  }}
                >
                  {NOTE_NAMES.map((note) => (
                    <option key={note} value={note}>
                      {note}
                    </option>
                  ))}
                </select>
                
                <span style={{ fontSize: '14px', color: '#6b7280' }}>옥타브</span>
                
                <select
                  value={selectedNote.octave}
                  onChange={(e) => {
                    const octave = parseInt(e.target.value);
                    const newNote = {
                      ...selectedNote,
                      octave,
                      frequency: getNoteFrequency(selectedNote.name, octave),
                    };
                    setSelectedNote(newNote);
                  }}
                  style={{
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                  }}
                >
                  {OCTAVE_RANGE.map((octave) => (
                    <option key={octave} value={octave}>
                      {octave}
                    </option>
                  ))}
                </select>
                
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  ({selectedNote.name}{selectedNote.octave} = {Math.round(selectedNote.frequency)}Hz)
                </span>
              </div>
            </div>

            {/* 사운드 제어 버튼 */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {!isInitialized ? (
                <button
                  onClick={handleInitializeSound}
                  style={{
                    padding: '12px 24px',
                    fontSize: '16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  사운드 활성화
                </button>
              ) : (
                <>
                  <button
                    onClick={soundEnabled ? handleStopSound : () => setSoundEnabled(true)}
                    style={{
                      padding: '12px 24px',
                      fontSize: '16px',
                      backgroundColor: soundEnabled ? '#ef4444' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '500',
                    }}
                  >
                    {soundEnabled ? '사운드 중지' : '사운드 재개'}
                  </button>
                  <span style={{ color: soundEnabled ? '#10b981' : '#6b7280', fontSize: '14px' }}>
                    상태: {soundEnabled ? '활성' : '비활성'}
                  </span>
                </>
              )}
            </div>
            <p style={{ marginTop: '12px', fontSize: '14px', color: '#6b7280' }}>
              기준 음표를 선택하면, 손의 Y축 위치에 따라 그 음표를 기준으로 -1 옥타브 ~ +1 옥타브 범위로 피치가 조절됩니다.
              <br />
              손을 위로 올리면 높은 음정, 아래로 내리면 낮은 음정이 재생됩니다.
            </p>
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