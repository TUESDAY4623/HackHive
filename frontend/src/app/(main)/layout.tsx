'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import NavBar from '@/components/NavBar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 56, animation: 'spin 1s linear infinite' }}>🐝</div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-family)' }}>Loading HackHive...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <>
      <NavBar />
      <main className="app-content">
        {children}
      </main>
    </>
  );
}
