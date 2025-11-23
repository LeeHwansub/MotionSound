import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { saveToken } from '../../lib/api/auth';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const { token } = router.query;

    if (token && typeof token === 'string') {
      saveToken(token);
      router.push('/');
    } else {
      router.push('/');
    }
  }, [router]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p>로그인 처리 중...</p>
    </div>
  );
}

