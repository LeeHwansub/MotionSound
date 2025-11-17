import '@testing-library/jest-dom'

// AudioContext 모킹
global.window = global.window || {}
global.mockAudioContext = {
  state: 'running',
  resume: jest.fn().mockResolvedValue(undefined),
  close: jest.fn(),
  createOscillator: jest.fn(() => ({
    type: 'sine',
    frequency: { value: 440 },
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  })),
  createGain: jest.fn(() => ({
    gain: { value: 0.5 },
    connect: jest.fn(),
  })),
  createBufferSource: jest.fn(() => ({
    buffer: null,
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  })),
  decodeAudioData: jest.fn().mockResolvedValue({}),
  destination: {},
}

function MockAudioContext() {
  return global.mockAudioContext
}

global.window.AudioContext = MockAudioContext
global.window.webkitAudioContext = MockAudioContext

// Canvas 모킹
HTMLCanvasElement.prototype.getContext = jest.fn((contextType) => {
  if (contextType === '2d') {
    return {
      canvas: {},
      clearRect: jest.fn(),
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      fillText: jest.fn(),
      strokeText: jest.fn(),
      measureText: jest.fn(() => ({ width: 0 })),
      setLineDash: jest.fn(),
      getLineDash: jest.fn(() => []),
      save: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      arc: jest.fn(),
      arcTo: jest.fn(),
      quadraticCurveTo: jest.fn(),
      bezierCurveTo: jest.fn(),
      rect: jest.fn(),
      scale: jest.fn(),
      rotate: jest.fn(),
      translate: jest.fn(),
      transform: jest.fn(),
      setTransform: jest.fn(),
      drawImage: jest.fn(),
      createImageData: jest.fn(() => ({ data: new Uint8ClampedArray(0), width: 0, height: 0 })),
      getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(0), width: 0, height: 0 })),
      putImageData: jest.fn(),
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      strokeStyle: '#000000',
      fillStyle: '#000000',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      miterLimit: 10,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      shadowBlur: 0,
      shadowColor: 'rgba(0, 0, 0, 0)',
      font: '10px sans-serif',
      textAlign: 'start',
      textBaseline: 'alphabetic',
    }
  }
  return null
})

