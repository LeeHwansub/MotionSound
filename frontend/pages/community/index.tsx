import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { fetchPosts, Post } from '../../lib/api/posts';

export default function CommunityPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const postsData = await fetchPosts();
      setPosts(postsData);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
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

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>커뮤니티 - Motion Sound</title>
      </Head>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>커뮤니티</h1>
          <Link
            href="/community/new"
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              backgroundColor: '#2563eb',
              color: 'white',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            새 게시물 작성
          </Link>
        </div>

        <div>
          {posts.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
              아직 게시물이 없습니다.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {posts.map((post) => (
                <div
                  key={post._id}
                  onClick={() => router.push(`/community/${post._id}`)}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{post.title}</h2>
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
                  <p
                    style={{
                      color: '#666',
                      marginBottom: '1rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {post.content}
                  </p>
                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: '#999' }}>
                    <span>작성자: {post.author}</span>
                    <span>조회수: {post.viewCount}</span>
                    <span>좋아요: {post.likeCount}</span>
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
