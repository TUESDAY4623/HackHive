'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Users, MessageSquare, User, Hexagon, LogOut, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import styles from './NavBar.module.css';

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/teams', label: 'Teams', icon: Users },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function NavBar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'HH';

  return (
    <>
      {/* Desktop Top Nav */}
      <nav className={styles.topNav}>
        <div className={styles.inner}>
          <Link href="/" className={styles.brand}>
            <div className={styles.brandIcon}>
              <Hexagon size={20} />
              <span className={styles.bee}>🐝</span>
            </div>
            <span className={styles.brandName}>HackHive</span>
          </Link>

          <div className={styles.navLinks}>
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/' && pathname.startsWith(href));
              return (
                <Link key={href} href={href} className={`${styles.navLink} ${active ? styles.active : ''}`}>
                  <Icon size={16} />
                  <span>{label}</span>
                  {active && <div className={styles.activeBar} />}
                </Link>
              );
            })}
          </div>

          <div className={styles.navRight}>
            <button className={styles.notifBtn}><Bell size={18} /></button>
            <Link href="/profile" className={styles.avatarWrap}>
              {user?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt={user.name} className={styles.avatarImg} />
              ) : (
                <div className={styles.avatarFallback}>{initials}</div>
              )}
            </Link>
            <button className={`${styles.logoutBtn} btn btn-ghost btn-sm`} onClick={logout} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className={styles.bottomNav}>
        <div className={styles.bottomInner}>
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link key={href} href={href} className={`${styles.bottomItem} ${active ? styles.bottomActive : ''}`}>
                {active && <div className={styles.bottomBar} />}
                <Icon size={22} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
