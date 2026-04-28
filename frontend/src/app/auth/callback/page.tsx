'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { initSocket } from '@/lib/socket';
import toast from 'react-hot-toast';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error(`OAuth login failed: ${error}`);
      router.push('/auth/login');
      return;
    }

    if (token) {
      localStorage.setItem('hackhive_token', token);
      authApi.getMe()
        .then(res => {
          const user = res.data.user;
          localStorage.setItem('hackhive_user', JSON.stringify(user));
          updateUser(user);
          initSocket(token);
          toast.success(`Welcome, ${user.name}! 🐝`);
          router.push('/');
        })
        .catch(() => {
          toast.error('Authentication failed');
          router.push('/auth/login');
        });
    } else {
      router.push('/auth/login');
    }
  }, [searchParams, router, updateUser]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 48, animation: 'spin 1s linear infinite' }}>🐝</div>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>Completing sign in...</p>
    </div>
  );
}
