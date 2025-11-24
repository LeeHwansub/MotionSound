import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import VideoEditor from '../VideoEditor'

global.MediaRecorder = jest.fn().mockImplementation(() => ({
  state: 'inactive',
  start: jest.fn(),
  stop: jest.fn(),
  ondataavailable: null,
  onstop: null,
  onerror: null,
})) as any

;(global.MediaRecorder as any).isTypeSupported = jest.fn(() => true)

Object.defineProperty(HTMLVideoElement.prototype, 'duration', {
  writable: true,
  value: 10,
  configurable: true,
})

Object.defineProperty(HTMLVideoElement.prototype, 'currentTime', {
  writable: true,
  value: 0,
  configurable: true,
})

Object.defineProperty(HTMLVideoElement.prototype, 'load', {
  writable: true,
  value: jest.fn(),
  configurable: true,
})

global.Audio = jest.fn().mockImplementation(() => ({
  onloadedmetadata: null,
  duration: 5,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}))

global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = jest.fn()

HTMLCanvasElement.prototype.captureStream = jest.fn(() => ({
  active: true,
  id: 'mock-stream',
  onaddtrack: null,
  onremovetrack: null,
  addTrack: jest.fn(),
  removeTrack: jest.fn(),
  getAudioTracks: jest.fn(() => []),
  getVideoTracks: jest.fn(() => []),
  getTracks: jest.fn(() => []),
  clone: jest.fn(),
})) as any

describe('VideoEditor', () => {
  const mockOnExport = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('렌더링되어야 함', () => {
    render(<VideoEditor onExport={mockOnExport} onCancel={mockOnCancel} />)
    expect(screen.getByText('영상 편집기')).toBeInTheDocument()
  })

  it('취소 버튼이 작동해야 함', () => {
    render(<VideoEditor onExport={mockOnExport} onCancel={mockOnCancel} />)
    const cancelButton = screen.getByText('취소')
    fireEvent.click(cancelButton)
    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('비디오가 없을 때 내보내기 버튼이 비활성화되어야 함', () => {
    render(<VideoEditor onExport={mockOnExport} onCancel={mockOnCancel} />)
    const exportButton = screen.getByText('내보내기')
    expect(exportButton).toBeDisabled()
  })

  it('비디오 Blob이 제공되면 URL을 생성해야 함', () => {
    const videoBlob = new Blob(['video'], { type: 'video/webm' })
    render(
      <VideoEditor
        initialVideoBlob={videoBlob}
        onExport={mockOnExport}
        onCancel={mockOnCancel}
      />
    )

    expect(global.URL.createObjectURL).toHaveBeenCalledWith(videoBlob)
  })

  it('오디오 추가 버튼이 표시되어야 함', () => {
    render(<VideoEditor onExport={mockOnExport} onCancel={mockOnCancel} />)
    const addAudioButton = screen.getByText('오디오 추가')
    expect(addAudioButton).toBeInTheDocument()
  })

  it('비디오 트랙과 오디오 트랙 섹션이 표시되어야 함', () => {
    render(<VideoEditor onExport={mockOnExport} onCancel={mockOnCancel} />)
    expect(screen.getByText('비디오 트랙')).toBeInTheDocument()
    expect(screen.getByText('오디오 트랙')).toBeInTheDocument()
  })
})
