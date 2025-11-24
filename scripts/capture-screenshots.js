const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, '../docs/screenshots');
const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const API_BASE = process.env.API_URL || 'http://localhost:4000';
const TEST_TOKEN = process.env.TEST_AUTH_TOKEN; // 테스트용 JWT 토큰 (선택사항)

// 스크린샷을 찍을 페이지 목록 (로그인 페이지 제외)
const pages = [
  { name: 'home', url: '/', description: '홈페이지' },
  { name: 'motion-capture', url: '/motion-capture', description: '모션 캡처 페이지' },
  { name: 'profile', url: '/profile', description: '프로필 페이지', requiresAuth: true, waitFor: 2000 },
  { name: 'community', url: '/community', description: '커뮤니티 페이지' },
  { name: 'community-new', url: '/community/new', description: '게시글 작성 페이지', requiresAuth: true, waitFor: 2000 },
];

async function captureScreenshots() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  console.log('🚀 브라우저를 시작합니다...');
  
  // 환경 변수에서 토큰 가져오기, 없으면 사용자 입력 요청
  let token = TEST_TOKEN;
  
  if (!token) {
    console.log('💡 현재 브라우저에서 로그인된 토큰을 가져오는 중...');
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    token = await new Promise((resolve) => {
      rl.question('브라우저 Console에서 localStorage.getItem("auth_token") 실행 후 토큰을 붙여넣으세요 (Enter만 누르면 토큰 없이 진행): ', (answer) => {
        rl.close();
        resolve(answer.trim() || null);
      });
    });
  } else {
    console.log('🔐 환경 변수에서 토큰을 사용합니다.');
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    
    // 뷰포트 설정 (일반적인 데스크톱 크기)
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    // 로그인이 필요한 페이지를 위해 토큰 설정
    const authToken = TEST_TOKEN || token;
    if (authToken) {
      console.log('🔐 인증 토큰을 설정합니다...');
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
      await page.evaluate((token) => {
        localStorage.setItem('auth_token', token);
      }, authToken);
      console.log('✅ 인증 토큰 설정 완료');
    } else {
      console.log('⚠️  토큰이 제공되지 않았습니다. 로그인이 필요한 페이지는 리다이렉트된 상태로 캡처됩니다.');
    }

    for (const pageConfig of pages) {
      try {
        console.log(`📸 ${pageConfig.description} 스크린샷 찍는 중... (${pageConfig.url})`);
        
        const fullUrl = `${BASE_URL}${pageConfig.url}`;
        await page.goto(fullUrl, {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });

        // 추가 대기 시간 (동적 콘텐츠 로딩 대기)
        const waitTime = pageConfig.waitFor || 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));

        // 로그인이 필요한 페이지인데 토큰이 없으면 리다이렉트된 상태를 캡처
        if (pageConfig.requiresAuth && !authToken) {
          const currentUrl = page.url();
          if (currentUrl.includes('/login')) {
            console.log(`⚠️  ${pageConfig.description}는 로그인이 필요합니다. 로그인 페이지로 리다이렉트된 상태를 캡처합니다.`);
          }
        }

        // 스크린샷 저장
        const screenshotPath = path.join(SCREENSHOT_DIR, `${pageConfig.name}.png`);
        await page.screenshot({
          path: screenshotPath,
          fullPage: true,
          type: 'png',
        });

        console.log(`✅ ${pageConfig.description} 저장 완료: ${screenshotPath}`);
      } catch (error) {
        console.error(`❌ ${pageConfig.description} 스크린샷 실패:`, error.message);
      }
    }

    console.log('\n✨ 모든 스크린샷 캡처 완료!');
  } catch (error) {
    console.error('❌ 스크린샷 캡처 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

// 스크립트 실행
captureScreenshots().catch(console.error);

