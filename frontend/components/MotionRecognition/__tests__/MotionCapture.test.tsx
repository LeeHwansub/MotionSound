import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { MotionCapture } from '../MotionCapture'

jest.mock('../../../hooks/useMotionRecognition', () => ({
  useMotionRecognition: jest.fn(() => ({
    isActive: false,
    isCameraActive: true,
    isLoading: false,
    motionData: null,
    error: null,
    start: jest.fn(),
    stop: jest.fn(),
    startCamera: jest.fn(),
    stopCamera: jest.fn(),
  })),
}))

describe('MotionCapture', () => {
  it('렌더링되어야 함', () => {
    render(<MotionCapture onMotionData={jest.fn()} />)
    expect(screen.getByText(/모션 인식/)).toBeInTheDocument()
  })

  it('웹캠 상태를 표시해야 함', () => {
    render(<MotionCapture onMotionData={jest.fn()} />)
    expect(screen.getByText(/웹캠/)).toBeInTheDocument()
  })
})

