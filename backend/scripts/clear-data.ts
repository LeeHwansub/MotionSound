import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 환경 변수 로드
dotenv.config({ path: path.join(__dirname, '../.env') });

async function clearData() {
  const mongoUri =
    process.env.MONGODB_URI ||
    `mongodb://localhost:27017/${
      process.env.MONGODB_DATABASE || 'motionsound'
    }`;

  try {
    console.log('MongoDB 연결 중...');
    await mongoose.connect(mongoUri);
    console.log('MongoDB 연결 성공');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('데이터베이스 연결 실패');
    }

    console.log('데이터 삭제 시작...\n');

    // 게시물 삭제 전 개수 확인
    const postCollection = db.collection('posts');
    const postCountBefore = await postCollection.countDocuments({});
    const publicPostCount = await postCollection.countDocuments({ isPublic: true });
    const privatePostCount = await postCollection.countDocuments({ isPublic: false });
    
    console.log(`게시물 현황:`);
    console.log(`  - 전체: ${postCountBefore}개`);
    console.log(`  - 공개: ${publicPostCount}개`);
    console.log(`  - 비공개: ${privatePostCount}개`);
    
    // 모든 게시물 삭제 (공개/비공개 구분 없이)
    const postResult = await postCollection.deleteMany({});
    console.log(`\n게시물 ${postResult.deletedCount}개 삭제 완료`);

    // 모션 패턴 삭제 전 개수 확인
    const patternCollection = db.collection('motionpatterns');
    const patternCountBefore = await patternCollection.countDocuments({});
    console.log(`\n모션 패턴 현황:`);
    console.log(`  - 전체: ${patternCountBefore}개`);
    
    // 모든 모션 패턴 삭제
    const patternResult = await patternCollection.deleteMany({});
    console.log(`모션 패턴 ${patternResult.deletedCount}개 삭제 완료`);

    console.log('\n모든 데이터 삭제 완료!');
  } catch (error) {
    console.error('데이터 삭제 중 오류 발생:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB 연결 종료');
  }
}

clearData();

