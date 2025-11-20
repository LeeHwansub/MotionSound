import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect, useMemo } from 'react';
import { fetchPost, Post } from '../../lib/api/posts';

export default function PostDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadPost(id);
    }
  }, [id]);

  const loadPost = async (postId: string) => {
    try {
      setLoading(true);
      const data = await fetchPost(postId);
      setPost(data);
    } catch (error) {
      console.error('게시물 로드 실패:', error);
      alert('게시물을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const resolvedVideoUrl = useMemo(() => {
    if (!post) {
      return null;
    }

    const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

    if (publicBase && post.videoKey) {
      const normalizedBase = publicBase.replace(/\/$/, '');
      return `${normalizedBase}/${post.videoKey}`;
    }

    if (post.videoUrl && post.videoUrl.startsWith('http')) {
      return post.videoUrl;
    }

    return null;
  }, [post]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>게시물을 찾을 수 없습니다.</p>
        <button
          onClick={() => router.push('/community')}
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{post.title} - Motion Sound</title>
      </Head>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <button
          onClick={() => router.push('/community')}
          style={{
            marginBottom: '2rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          ← 목록으로
        </button>

        <article
          style={{
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '2rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
            <h1 style={{ margin: 0, fontSize: '2rem' }}>{post.title}</h1>
            <span
              style={{
                padding: '0.25rem 0.75rem',
                backgroundColor: post.isPublic ? '#e3f2fd' : '#f5f5f5',
                color: post.isPublic ? '#1976d2' : '#666',
                borderRadius: '12px',
                fontSize: '0.875rem',
              }}
            >
              {post.isPublic ? '공개' : '비공개'}
            </span>
          </div>

          <div style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: '#666' }}>
              <span>작성자: {post.author}</span>
              <span>조회수: {post.viewCount}</span>
              <span>좋아요: {post.likeCount}</span>
              <span>{formatDate(post.createdAt)}</span>
            </div>
          </div>

          <div
            style={{
              lineHeight: '1.8',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {post.content}
          </div>

          {resolvedVideoUrl && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>영상</h3>
              <video
                src={resolvedVideoUrl}
                controls
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  backgroundColor: '#000',
                }}
              />
            </div>
          )}

          {post.motionPatternId && (
            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                연결된 모션 패턴 ID: {post.motionPatternId}
              </p>
            </div>
          )}
        </article>
      </div>
    </>
  );
}

