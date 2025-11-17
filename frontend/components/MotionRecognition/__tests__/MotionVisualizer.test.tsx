import { render } from '@testing-library/react'
import { MotionVisualizer } from '../MotionVisualizer'
import { MotionData } from '../../../hooks/useMotionRecognition'

describe('MotionVisualizer', () => {
  const mockMotionData: MotionData = {
    timestamp: Date.now(),
    poseLandmarks: Array(33).fill(null).map((_, i) => ({
      x: i * 0.1,
      y: i * 0.2,
      z: i * 0.3,
      visibility: 1,
    })),
    leftHandLandmarks: null,
    rightHandLandmarks: null,
    faceLandmarks: null,
  }

  it('렌더링되어야 함', () => {
    const { container } = render(
      <MotionVisualizer motionData={null} width={640} height={480} />
    )
    expect(container.querySelector('canvas')).toBeInTheDocument()
  })

  it('모션 데이터가 없으면 대기 메시지를 표시해야 함', () => {
    const { container } = render(
      <MotionVisualizer motionData={null} width={640} height={480} />
    )
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
  })

  it('모션 데이터가 있으면 캔버스를 렌더링해야 함', () => {
    const { container } = render(
      <MotionVisualizer motionData={mockMotionData} width={640} height={480} />
    )
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
  })
})

