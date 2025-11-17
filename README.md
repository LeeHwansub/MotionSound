# Motion Sound

> **"몸의 움직임이 바로 악보가 되는 세상"**

Motion Sound는 단순한 모션 인식 기술이 아니라, 사용자의 제스처를 예술로 번역하는 인터랙티브 사운드 플랫폼입니다.

---

## 목차

- [프로젝트 개요](#1-프로젝트-개요)
- [설치 및 실행](#2-설치-및-실행)
- [폴더 구조](#3-폴더-구조)
- [기술 스택](#4-기술-스택--버전)
- [주요 기능](#5-주요-기능-요약)
- [실행 시나리오](#6-실행-시나리오)
- [API 문서](#7-api-문서-간략)
- [기여 가이드](#8-기여-가이드)
- [환경 변수](#9-환경-변수-env)
- [모션 인식 프로토타입 개발 현황](#10-모션-인식-프로토타입-개발-현황)
- [개발 중 문제점 및 해결 방안](#11-개발-중-문제점-및-해결-방안)
- [로드맵](#12-to-do-roadmap)

---

## 1. 프로젝트 개요

### 프로젝트 목적

현대의 음악 생성 도구는 여전히 '기계'에 가깝습니다.  
우리는 **"몸짓만으로도 음악을 만든다"**는 전제를 깨고 싶었습니다.

Motion Sound는 카메라 하나만 있으면 누구나 **'몸으로 연주'**할 수 있게 설계되었습니다.

- **AI는 '도구'가 아니라 '번역가'입니다**
  - 움직임을 해석해 음으로 바꾸는 과정은 예술과 기술의 접점입니다

- **브라우저에서 끝나는 즉시성**
  - 설치 없이 바로 참여할 수 있어야 진짜 '경험'이 됩니다

### 기술 구조 개요

이 프로젝트는 세 가지 핵심 축으로 설계되었습니다.

#### Perception Layer (인식)

- **MediaPipe Pose, Hands, FaceMesh + TensorFlow.js**
- 손, 팔, 상체, 얼굴의 움직임을 초당 30fps로 수집
- 좌표를 smoothing 및 normalization 처리
- 실시간 랜드마크 감지 및 시각화

#### Mapping Layer (매핑)

- **Y축 → 음정(Pitch)**
- **이동속도 → 볼륨**
- **진동 → Vibrato**
- 실제 음악적 감정선을 표현하기 위한 수학적 해석 계층

#### Expression Layer (표현)

- **Web Audio API**를 통한 실시간 음 재생
- **ADSR Envelope, Filter, Reverb** 등 자연스러운 사운드 모델링

> **즉, "사람의 움직임 → 감정 데이터 → 사운드 파형"으로 흐르는 단일 파이프라인**

### 아키텍처 설계 철학

| 계층 | 기술 | 설계 의도 |
|------|------|-----------|
| **Frontend** | Next.js + WebRTC + Web Audio API | 사용자 경험 중심: 지연 최소화, 반응형, WebCam 접근 |
| **Backend** | Nest.js + Socket.IO + JWT | 명확한 모듈 경계, 실시간 세션 관리, 인증/보안 내장 |
| **Database** | MySQL + MongoDB 혼용 | 정형(회원, 설정) + 비정형(모션, 사운드) 데이터 분리 |
| **Infra** | Docker + Nginx | 환경 일관성, 빠른 배포, HTTPS 통신 안정성 |

---

## 2. 설치 및 실행

### 방법 1: Docker Compose 사용 (권장)

```bash
# 1. 레파지토리 클론
git clone https://github.com/LeeHwansub/MotionSound.git
cd MotionSound

# 2. 환경 변수 설정
cp .env.example .env
# .env 파일을 열어서 필요한 값들을 수정하세요

# 3. 의존성 설치
npm run install:all

# 4. Docker 실행
docker-compose up -d

# 모든 서비스가 자동으로 시작됩니다
```

### 방법 2: 로컬 개발 환경

```bash
# 1-2. 위와 동일 (클론 및 환경 변수 설정)

# 3. 의존성 설치
npm run install:all
# 또는 개별 설치:
# npm install              # 루트 (concurrently)
# cd frontend && npm install
# cd ../backend && npm install

# 4. 개발 환경 시작
npm run start:dev
```

---

## 3. 폴더 구조

```
motion-sound/
├── frontend/           # Next.js 프론트엔드
│   ├── components/     # 재사용 가능한 컴포넌트
│   │   └── __tests__/ # 컴포넌트 테스트 파일
│   ├── pages/          # Next.js 페이지
│   ├── hooks/          # React 훅
│   │   └── __tests__/  # 훅 테스트 파일
│   ├── lib/            # 유틸리티 함수
│   │   └── __tests__/  # 유틸리티 테스트 파일
│   ├── public/         # 정적 파일
│   ├── jest.config.js  # Jest 설정
│   └── jest.setup.js   # Jest 전역 설정
│
├── backend/            # Nest.js 백엔드
│   ├── src/
│   │   ├── modules/    # 기능 모듈
│   │   ├── entities/   # 데이터베이스 엔티티
│   │   ├── common/     # 공통 모듈
│   │   └── config/     # 설정 파일
│   └── main.ts         # 애플리케이션 진입점
│
├── docker-compose.yml       # 개발 환경 Docker Compose
├── docker-compose.prod.yml  # 프로덕션 환경 Docker Compose
├── README.md
└── .env.example
```

---

## 4. 기술 스택 & 버전

| 영역 | 기술 | 버전 | 이유 |
|------|------|------|------|
| **Frontend** | Next.js | 14 | SSR + SEO + Hybrid Rendering |
| **Backend** | Nest.js | 10 | 구조화된 Node 프레임워크 |
| **DB** | MySQL | 8.0 | 관계형 데이터 |
| **DB** | MongoDB | 7.0 | 비정형 데이터 (모션/음 정보) |
| **Testing** | Jest | - | 단위 테스트 및 통합 테스트 |
| **Infra** | Docker | 27 | 일관된 배포 환경 |

---

## 5. 주요 기능 요약

- **회원가입 / 로그인** (JWT 기반 인증)
- **실시간 모션 인식** (MediaPipe Pose, Hands, FaceMesh)
  - 포즈 인식: 33개 랜드마크 포인트 (전신 골격 구조)
  - 손 인식: 양손 각 21개 랜드마크 포인트 (손가락 관절)
  - 얼굴 인식: 468개 랜드마크 포인트 (얼굴 윤곽선, 눈, 코, 입)
- **실시간 모션 시각화** (Canvas 기반 렌더링)
- **모션 → 사운드 매핑** (Web Audio API)
  - 음표 기반 실시간 피치 제어 (Y축 위치에 따라 -1 옥타브 ~ +1 옥타브)
  - 이동 속도 기반 볼륨 제어
  - 양손 독립 제어
- **모션 패턴 캡처 및 자동 재생**
  - 모션 패턴 저장 (로컬 스토리지)
  - 모션 패턴 매칭 및 자동 오디오 재생
  - 음표 기반 실시간 피치 제어와 오디오 파일 재생 동시 지원
- **연주 저장 / 불러오기** (MongoDB) - 개발 예정
- **연주 공유** (커뮤니티 페이지) - 개발 예정

---

## 6. 실행 시나리오

```
1. 사용자가 카메라 허용
   ↓
2. 프론트에서 MediaPipe로 손/팔 좌표 인식
   ↓
3. TensorFlow.js 모델이 동작 → 좌표 smoothing
   ↓
4. Nest.js API가 매핑된 데이터 전달
   ↓
5. Web Audio API로 사운드 출력
```

---

## 7. API 문서 (간략)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | 회원가입 |
| `POST` | `/api/auth/login` | 로그인 |
| `GET` | `/api/motion/stream` | 모션 실시간 스트리밍 |
| `POST` | `/api/music/save` | 연주 저장 |
| `GET` | `/api/music/:id` | 연주 불러오기 |

---

## 8. 기여 가이드

### Branch 전략

- `main` - 안정 버전 (프로덕션)
- `develop` - 개발 브랜치
- `feature/*` - 기능 개발 브랜치

### Commit 규칙

- `feat:` - 새로운 기능 추가
- `fix:` - 버그 수정
- `chore:` - 빌드/설정 관련 작업
- `docs:` - 문서 수정
- `refactor:` - 코드 리팩토링

---

## 9. 환경 변수 (.env)

```bash
# Database 설정
MYSQL_PASSWORD=rootpassword
MYSQL_DATABASE=motionsound
MYSQL_USER=root

# MongoDB 설정
MONGODB_DATABASE=motionsound

# JWT 설정
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server 설정
PORT=4000
NODE_ENV=development

# CORS 설정
CORS_ORIGIN=http://localhost:3000

# Frontend 설정
NEXT_PUBLIC_API_URL=http://localhost:4000
```

> **참고**: `.env.example` 파일을 복사하여 `.env`를 생성하고 필요한 값들을 수정하세요.

---

## 10. 모션 인식 프로토타입 개발 현황

### 완료된 기능

#### MediaPipe 통합
- **MediaPipe Pose**: 33개 랜드마크 포인트로 전신 골격 구조 인식
- **MediaPipe Hands**: 양손 각 21개 랜드마크 포인트로 손가락 관절 인식
- **MediaPipe FaceMesh**: 468개 랜드마크 포인트로 얼굴 윤곽선, 눈, 코, 입 인식

#### 실시간 모션 캡처
- 웹캠 자동 활성화
- 실시간 프레임 처리 (약 30fps)
- Canvas 기반 이미지 전처리 (좌우 반전 처리)

#### 모션 시각화
- Pose 랜드마크 시각화 (초록색, #00ff88)
- Hands 랜드마크 시각화 (왼손: 빨간색 #ff4444, 오른손: 파란색 #4488ff)
- FaceMesh 랜드마크 시각화 (주황색, #ffaa00)
- 부드러운 애니메이션 렌더링 (requestAnimationFrame)

#### 컴포넌트 구조
- `MotionCapture`: 웹캠 제어 및 모션 인식 시작/중지
- `MotionVisualizer`: Canvas 기반 모션 데이터 시각화
- `useMotionRecognition`: 모션 인식 로직을 관리하는 커스텀 훅

#### Web Audio API 통합
- **AudioEngine**: 오실레이터 및 오디오 파일 재생 관리
- **음표 기반 피치 제어**: 사용자가 선택한 음표를 기준으로 실시간 피치 조절
- **모션-사운드 매핑**: Y축 위치 → 피치, 이동 속도 → 볼륨
- **양손 독립 제어**: 왼손과 오른손이 각각 다른 음을 재생

#### 모션 패턴 시스템
- **모션 패턴 캡처**: 사용자의 모션을 샘플링하여 저장
- **패턴 매칭**: 실시간 모션과 저장된 패턴의 유사도 계산
- **자동 재생**: 매칭된 패턴의 오디오 파일 또는 음표 기반 사운드 재생
- **로컬 스토리지 저장**: 브라우저 로컬 스토리지에 패턴 저장
- **오디오 프리로딩 및 캐싱**: 패턴 로드 시 오디오 파일을 미리 로드하여 재생 지연 최소화
- **패턴 유지 로직**: 매칭되지 않은 모션이 나와도 이전에 매칭된 패턴의 음악 유지

#### 테스트 환경
- **Jest 설정**: 단위 테스트 및 통합 테스트 환경 구축
- **컴포넌트 테스트**: React Testing Library를 사용한 컴포넌트 테스트
- **훅 테스트**: 커스텀 훅 동작 검증
- **유틸리티 테스트**: 순수 함수 및 유틸리티 함수 테스트
- **브라우저 API 모킹**: AudioContext, Canvas API 등 브라우저 전용 API 모킹

### 개발 중인 기능

- [ ] MongoDB 연동 (서버 저장)
- [ ] 모션 패턴 서버 동기화
- [ ] 더 정교한 모션 매칭 알고리즘
- [ ] 테스트 커버리지 확대

---

## 11. 개발 중 문제점 및 해결 방안

### 문제 1: MediaPipe Holistic의 onResults 콜백 미작동

**문제점:**
- MediaPipe Holistic을 사용하여 포즈, 손, 얼굴을 한 번에 인식하려 했으나, `onResults` 콜백이 호출되지 않음
- 프레임은 정상적으로 전송되지만 결과를 받지 못함
- MediaPipe Holistic은 2023년 3월부터 지원이 종료된 레거시 솔루션

**해결 방안:**
- MediaPipe 개별 솔루션으로 전환 (Pose, Hands, FaceMesh)
- 각 솔루션을 독립적으로 초기화하고 순차적으로 로드
- `onResults` 콜백을 각 솔루션별로 개별 설정

```typescript
// 개별 솔루션 초기화
const pose = new Pose({ locateFile: poseLocateFile });
pose.onResults(config.onPoseResults);

const hands = new Hands({ locateFile: handsLocateFile });
hands.onResults(config.onHandsResults);

const faceMesh = new FaceMesh({ locateFile: faceMeshLocateFile });
faceMesh.onResults(config.onFaceResults);
```

---

### 문제 2: WASM 모듈 충돌

**문제점:**
- 여러 MediaPipe 솔루션을 동시에 로드할 때 WASM 모듈 충돌 발생
- `RuntimeError: Aborted(Module.arguments has been replaced...)` 오류
- 각 솔루션이 동일한 전역 WASM 모듈을 사용하려고 시도

**해결 방안:**
- 각 솔루션을 순차적으로 로드 (Pose → Hands → FaceMesh)
- 각 솔루션 초기화 후 충분한 대기 시간 부여 (5초)
- 각 솔루션별로 독립적인 `locateFile` 함수 구현

```typescript
// 순차적 로딩
await new Promise(resolve => setTimeout(resolve, 5000)); // Pose 로드 대기
await new Promise(resolve => setTimeout(resolve, 2000)); // Hands 로드 전 대기
await new Promise(resolve => setTimeout(resolve, 5000)); // Hands 로드 대기
```

---

### 문제 3: CDN 경로 문제 (jsdelivr 404 오류)

**문제점:**
- `jsdelivr` CDN에서 MediaPipe asset 파일을 로드할 때 404 오류 발생
- 일부 파일이 `text/plain` MIME 타입으로 반환되어 실행 불가
- 다른 솔루션의 asset 파일을 잘못된 경로에서 요청

**해결 방안:**
- `unpkg` CDN으로 변경
- 각 솔루션별로 버전을 명시하여 정확한 경로 사용
- `locateFile` 함수에서 각 솔루션의 asset 파일 경로를 명확히 구분

```typescript
const poseLocateFile = (file: string) => {
  const version = '0.5.1675469404';
  return `https://unpkg.com/@mediapipe/pose@${version}/${file}`;
};
```

---

### 문제 4: 서버사이드 렌더링 (SSR) 문제

**문제점:**
- Next.js의 서버사이드 렌더링 중 MediaPipe 모듈이 실행되어 `ReferenceError: navigator is not defined` 오류 발생
- 브라우저 전용 API (`navigator`, `window`)를 서버에서 접근 시도

**해결 방안:**
- 동적 import를 사용하여 클라이언트에서만 모듈 로드
- `typeof window === 'undefined'` 체크 추가
- `'use client'` 디렉티브는 Pages Router에서 작동하지 않으므로 동적 import 사용

```typescript
export const createMediaPipeInstances = async (config: MediaPipeConfig) => {
  if (typeof window === 'undefined') {
    throw new Error('MediaPipe는 브라우저 환경에서만 사용할 수 있습니다.');
  }
  
  const { Pose } = await import('@mediapipe/pose');
  // ...
};
```

---

### 문제 5: 좌우 반전 문제 (왼손/오른손 구분)

**문제점:**
- 웹캠은 거울처럼 좌우가 반전된 이미지를 제공
- MediaPipe가 웹캠의 좌우 반전된 이미지를 기준으로 왼손/오른손을 판단하여, 실제 사용자 입장에서는 반대로 표시됨
- 시각화에서도 좌우가 반전되어 혼란 발생

**해결 방안:**
- MediaPipe에 전송하기 전에 Canvas에서 이미지를 좌우 반전 처리
- 이렇게 하면 MediaPipe가 사용자 입장에서의 왼손/오른손을 올바르게 판단
- 시각화에서는 추가 반전 없이 MediaPipe 결과를 그대로 사용

```typescript
// Canvas에 좌우 반전하여 그리기
ctx.save();
ctx.scale(-1, 1);
ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
ctx.restore();
```

---

### 문제 6: 웹캠과 모션 인식 분리

**문제점:**
- 모션 인식을 중지하면 웹캠도 함께 비활성화됨
- 사용자가 모션 인식을 일시 중지해도 웹캠은 계속 활성화되어 있어야 함

**해결 방안:**
- 웹캠 제어와 모션 인식을 별도 함수로 분리
- `startCamera()` / `stopCamera()`: 웹캠 스트림 제어
- `start()` / `stop()`: 모션 인식 제어
- 컴포넌트 마운트 시 웹캠 자동 활성화, 언마운트 시에만 웹캠 비활성화

```typescript
// 웹캠과 모션 인식 분리
const startCamera = useCallback(async () => {
  // 웹캠만 시작
}, []);

const start = useCallback(async () => {
  // 모션 인식만 시작
}, []);

const stop = useCallback(() => {
  // 모션 인식만 중지
}, []);

const stopCamera = useCallback(() => {
  // 웹캠만 중지
}, []);
```

---

### 문제 7: 오디오 재생 지연

**문제점:**
- 모션 패턴이 매칭된 후 오디오 파일 재생까지 지연 발생
- 네트워크 요청 및 디코딩 시간으로 인한 사용자 경험 저하

**해결 방안:**
- 패턴 로드 시 오디오 파일을 미리 프리로드
- 디코딩된 `AudioBuffer`를 메모리에 캐싱
- 재생 시 캐시된 버퍼를 사용하여 즉시 재생

```typescript
// 오디오 프리로딩 및 캐싱
const audioBufferCacheRef = useRef<Map<string, AudioBuffer>>(new Map());

useEffect(() => {
  // 패턴 로드 시 오디오 파일 프리로드
  patterns.forEach(async (pattern) => {
    if (pattern.audioUrl && !audioBufferCacheRef.current.has(pattern.audioUrl)) {
      const buffer = await fetchAndDecodeAudio(pattern.audioUrl);
      audioBufferCacheRef.current.set(pattern.audioUrl, buffer);
    }
  });
}, [patterns]);
```

---

### 문제 8: 매칭되지 않은 모션 시 음악 전환

**문제점:**
- 매칭되지 않은 모션이 나올 때 이전 패턴의 음악이 중지되고 다른 패턴으로 전환
- 사용자가 의도하지 않은 모션을 취했을 때 음악이 끊기는 문제

**해결 방안:**
- 매칭되지 않은 모션이 나와도 이전에 매칭된 패턴의 음악 유지
- 새로운 패턴이 매칭될 때만 음악 전환
- `matchedPattern` 상태를 `bestMatch`가 null일 때 유지

```typescript
// 패턴 매칭 로직 개선
const bestMatch = findBestMatch(motionData, patterns, threshold);
if (bestMatch) {
  // 새로운 패턴이 매칭되면 전환
  setMatchedPattern(bestMatch);
} else {
  // 매칭되지 않으면 이전 패턴 유지
  // matchedPattern 상태는 변경하지 않음
}
```

---

## 12. To-Do (Roadmap)

### 1단계: 실시간 모션 → 음 출력
- [x] MediaPipe 연동 (Pose, Hands, FaceMesh)
- [x] 실시간 모션 시각화
- [x] Web Audio API 기본 구현
- [x] 모션-음 매핑 알고리즘
- [x] 음표 기반 실시간 피치 제어
- [x] 모션 패턴 캡처 및 저장 (로컬 스토리지)
- [x] 모션 패턴 매칭 및 자동 재생
- [x] 오디오 프리로딩 및 캐싱
- [x] 테스트 환경 구축 (Jest)

### 2단계: 연주 저장 / 재생
- [ ] MongoDB 연동
- [ ] 서버에 모션 패턴 저장/불러오기
- [ ] 연주 데이터 저장/불러오기
- [x] 로컬 스토리지 기반 모션 패턴 저장 (완료)
- [x] 테스트 커버리지 확대 (진행 중)

### 3단계: 커뮤니티 공유 / 협연 모드
- [ ] 커뮤니티 페이지
- [ ] 연주 공유 기능
- [ ] 실시간 협연 모드