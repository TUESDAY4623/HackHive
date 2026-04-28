'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Github, User, Mail, Lock, AtSign, Hexagon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import styles from '../login/page.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', handle: '', email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.handle.trim()) e.handle = 'Handle is required';
    else if (!/^[a-z0-9_]+$/.test(form.handle.toLowerCase())) e.handle = 'Only letters, numbers, underscores';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'At least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form.name, form.handle.toLowerCase(), form.email, form.password);
      router.push('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider: 'github' | 'google') => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/auth/${provider}`;
  };

  return (
    <div className={styles.authPage}>
      <div className={`${styles.authCard} animate-fade-in-up`}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <Hexagon size={22} />
            <span className={styles.bee}>🐝</span>
          </div>
          <span className={styles.brandName}>HackHive</span>
        </div>

        <h1 className={styles.title}>Join the Hive</h1>
        <p className={styles.subtitle}>Create your developer profile and start hacking</p>

        <div className={styles.oauthGroup}>
          <button className={`btn btn-secondary w-full ${styles.oauthBtn}`} onClick={() => handleOAuth('github')}>
            <Github size={18} />
            Sign up with GitHub
          </button>
          <button className={`btn btn-secondary w-full ${styles.oauthBtn}`} onClick={() => handleOAuth('google')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </button>
        </div>

        <div className={styles.dividerRow}>
          <div className={styles.dividerLine} />
          <span className={styles.dividerText}>or register with email</span>
          <div className={styles.dividerLine} />
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <div className={styles.inputIconWrap}>
              <User size={16} className={styles.inputIcon} />
              <input id="name" type="text" className={`form-input ${styles.inputWithIcon} ${errors.name ? 'error' : ''}`}
                placeholder="Aly Usra" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="handle">Username / Handle</label>
            <div className={styles.inputIconWrap}>
              <AtSign size={16} className={styles.inputIcon} />
              <input id="handle" type="text" className={`form-input ${styles.inputWithIcon} ${errors.handle ? 'error' : ''}`}
                placeholder="alyusra" value={form.handle}
                onChange={e => setForm(f => ({ ...f, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))} />
            </div>
            {errors.handle && <span className="form-error">{errors.handle}</span>}
            <span className="form-hint">hackhive.app/@{form.handle || 'yourhandle'}</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <div className={styles.inputIconWrap}>
              <Mail size={16} className={styles.inputIcon} />
              <input id="email" type="email" className={`form-input ${styles.inputWithIcon} ${errors.email ? 'error' : ''}`}
                placeholder="you@example.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <div className={styles.inputIconWrap}>
              <Lock size={16} className={styles.inputIcon} />
              <input id="reg-password" type={showPwd ? 'text' : 'password'}
                className={`form-input ${styles.inputWithIcon} ${styles.inputWithRight} ${errors.password ? 'error' : ''}`}
                placeholder="Min. 6 characters" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              <button type="button" className={styles.pwdToggle} onClick={() => setShowPwd(v => !v)}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <button type="submit" className={`btn btn-primary btn-lg w-full ${styles.submitBtn}`} disabled={loading}>
            {loading ? '⟳ Creating account...' : '🐝 Create Account'}
          </button>
        </form>

        <p className={styles.switchLink}>
          Already a member?{' '}
          <Link href="/auth/login" className={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
