import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { saveToken } from '../../lib/api/auth';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthCallback() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const { token } = router.query;

    if (token && typeof token === 'string') {
      saveToken(token);
      refreshUser().then(() => {
        router.push('/');
      });
    } else {
      router.push('/');
    }
  }, [router, refreshUser]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p>로그인 처리 중...</p>
    </div>
  );
}

