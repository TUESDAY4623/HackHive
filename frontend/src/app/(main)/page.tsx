'use client';

import { useState, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, UserPlus, ChevronRight, Zap, Trophy, Star, RefreshCw } from 'lucide-react';
import { projectsApi, hackathonsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Project, Hackathon } from '@/types';
import Link from 'next/link';
import toast from 'react-hot-toast';
import styles from './page.module.css';

const ACCENT_COLORS = ['#7c3aed','#06b6d4','#4ade80','#f472b6','#fb923c','#facc15','#60a5fa'];

// ── DEMO DATA ─────────────────────────────────────────────────────────────────
// These cards are for visual reference only and are shown when no real data exists.
// Remove or gate behind a feature flag once production data is consistently populated.
const DEMO_HACKATHONS: Partial<Hackathon>[] = [
  { _id: 'demo-h1', title: 'HackIndia 2025', emoji: '🇮🇳', accentColor: '#f472b6', status: 'active' },
  { _id: 'demo-h2', title: 'MLH Local Hack Day', emoji: '🟣', accentColor: '#7c3aed', status: 'active' },
  { _id: 'demo-h3', title: 'Devfolio Build', emoji: '🔵', accentColor: '#3b82f6', status: 'upcoming' },
  { _id: 'demo-h4', title: 'Smart India', emoji: '⚡', accentColor: '#facc15', status: 'active' },
];

const DEMO_PROJECTS: Partial<Project>[] = [
  {
    _id: 'demo-p1',
    title: 'EcoTrack — Carbon Footprint Monitor',
    description: 'A real-time dashboard that aggregates IoT sensor data to visualise personal and corporate carbon emissions. Built for the Green Futures Hackathon.',
    techStack: ['Next.js', 'Python', 'InfluxDB', 'Tailwind'],
    rolesNeeded: ['ML Engineer', 'UI/UX Designer'],
    progress: 68,
    accentColor: '#4ade80',
    likes: [],
    likeCount: 42,
    comments: [],
    hackathonName: 'Green Futures 2025',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    owner: { _id: 'demo-u1', name: 'Priya Sharma', handle: 'priya_s', level: 'Pro' },
  },
  {
    _id: 'demo-p2',
    title: 'MediScan — AI Diagnosis Assistant',
    description: 'Leverages fine-tuned vision transformers to analyse chest X-rays and flag potential anomalies for radiologists, reducing review time by 60%.',
    techStack: ['PyTorch', 'FastAPI', 'React', 'Docker'],
    rolesNeeded: ['Backend Dev', 'DevOps'],
    progress: 45,
    accentColor: '#06b6d4',
    likes: [],
    likeCount: 87,
    comments: [],
    hackathonName: 'HealthTech Hack',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    owner: { _id: 'demo-u2', name: 'Arjun Mehta', handle: 'arjun_m', level: 'Elite' },
  },
  {
    _id: 'demo-p3',
    title: 'FinFlow — Smart Budgeting App',
    description: 'Connects to UPI and bank APIs to automatically categorise transactions and provide AI-powered savings recommendations.',
    techStack: ['Flutter', 'Node.js', 'MongoDB', 'OpenAI'],
    rolesNeeded: ['Mobile Dev', 'Frontend Dev'],
    progress: 82,
    accentColor: '#fb923c',
    likes: [],
    likeCount: 31,
    comments: [],
    hackathonName: 'FinTech Bowl',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    owner: { _id: 'demo-u3', name: 'Sneha Reddy', handle: 'sneha_r', level: 'Dev' },
  },
];
// ── END DEMO DATA ─────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [myHackathons, setMyHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, hRes] = await Promise.all([
        projectsApi.getAll({ limit: '10' }),
        hackathonsApi.getAll({ status: 'active', limit: '6' }),
      ]);
      setProjects(pRes.data.projects || []);
      setMyHackathons(hRes.data.hackathons || []);
    } catch {
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLike = async (projectId: string) => {
    if (liking.has(projectId)) return;
    setLiking(s => new Set(s).add(projectId));
    try {
      await projectsApi.like(projectId);
      setProjects(prev => prev.map(p => {
        if (p._id !== projectId) return p;
        const isLiked = p.likes.includes(user!._id);
        return {
          ...p,
          likes: isLiked ? p.likes.filter(id => id !== user!._id) : [...p.likes, user!._id],
          likeCount: isLiked ? p.likeCount - 1 : p.likeCount + 1,
        };
      }));
    } catch { toast.error('Failed to like'); }
    finally { setLiking(s => { const n = new Set(s); n.delete(projectId); return n; }); }
  };

  const handleJoin = async (projectId: string) => {
    try {
      await projectsApi.requestJoin(projectId, "I'd love to contribute to this project!");
      toast.success('Join request sent! 🚀');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error';
      toast.error(msg);
    }
  };

  return (
    <div className={`container ${styles.page}`}>
      {/* Hero */}
      <div className={`${styles.hero} animate-fade-in-up`}>
        <div className={styles.heroBadge}><Zap size={12} />{myHackathons.length} Hackathons Active Now</div>
        <h1 className={styles.heroTitle}>
          Hey {user?.name?.split(' ')[0]} 👋<br />
          <span className="gradient-text">Build. Connect. Win.</span>
        </h1>
        <p className={styles.heroSub}>Your hackathon journey continues here.</p>
        <div className={styles.heroActions}>
          <Link href="/explore" className="btn btn-primary btn-lg"><Trophy size={18}/>Explore Hackathons</Link>
          <Link href="/teams" className="btn btn-secondary btn-lg">Find Teammates</Link>
        </div>
      </div>

      {/* My Hackathons Stories */}
      {/* Shows real hackathons when available, otherwise falls back to DEMO cards */}
      <section className={`${styles.storiesSection} animate-fade-in-up delay-1`}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <h2 className="section-title">Active Hackathons</h2>
          <Link href="/explore" className="btn btn-ghost btn-sm" style={{ color:'var(--purple-400)', gap:4 }}>
            See all <ChevronRight size={14}/>
          </Link>
        </div>
        <div className={styles.storiesRow}>
          {(myHackathons.length > 0 ? myHackathons : DEMO_HACKATHONS as Hackathon[]).map((h, i) => (
            <Link key={h._id} href={`/explore`} className={styles.storyItem} style={{ position:'relative' }}>
              <div className={styles.storyRing} style={{ background: h.accentColor || ACCENT_COLORS[i % ACCENT_COLORS.length] }}>
                <div className={styles.storyAvatar}><span className={styles.storyEmoji}>{h.emoji || '🏆'}</span></div>
              </div>
              <span className={styles.storyLabel}>{h.title.split(' ')[0]}</span>
              <div className={styles.storyActiveDot} />
              {/* DEMO badge — remove once real data is populated */}
              {myHackathons.length === 0 && (
                <span style={{ position:'absolute', top:-4, right:-4, fontSize:7, fontWeight:800, background:'#facc15', color:'#000', borderRadius:4, padding:'1px 4px', lineHeight:1.4, textTransform:'uppercase', letterSpacing:'0.05em' }}>DEMO</span>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Project Feed */}
      <section className={styles.feedSection}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <h2 className="section-title">Project Feed</h2>
          <button onClick={fetchData} className="btn btn-ghost btn-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className={styles.loadingGrid}>
            {[1,2,3].map(i => <div key={i} className={`glass-card ${styles.skeleton}`} />)}
          </div>
        ) : projects.length === 0 ? (
          // ── DEMO PROJECT CARDS (shown only when no real projects exist) ──────
          <div className={styles.feed}>
            {/* Yellow notice banner */}
            <div style={{ gridColumn:'1/-1', display:'flex', alignItems:'center', gap:10, background:'rgba(250,204,21,0.08)', border:'1px solid rgba(250,204,21,0.25)', borderRadius:12, padding:'10px 16px', marginBottom:4 }}>
              <span style={{ fontSize:16 }}>🧪</span>
              <span style={{ fontSize:12, color:'rgba(250,204,21,0.85)', fontWeight:600 }}>Demo cards — for visual reference only. Real cards appear once users post projects.</span>
            </div>
            {DEMO_PROJECTS.map((project, idx) => {
              const accent = (project as Project).accentColor || ACCENT_COLORS[idx % ACCENT_COLORS.length];
              const p = project as Project;
              const initials = p.owner?.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || '??';
              return (
                <article key={p._id} className={`glass-card ${styles.card} animate-fade-in-up delay-${Math.min(idx+1,5)}`} style={{ position:'relative' }}>
                  {/* DEMO watermark badge */}
                  <span style={{ position:'absolute', top:14, right:14, fontSize:9, fontWeight:800, background:'rgba(250,204,21,0.18)', color:'#facc15', border:'1px solid rgba(250,204,21,0.35)', borderRadius:6, padding:'2px 7px', letterSpacing:'0.08em', textTransform:'uppercase', zIndex:2 }}>DEMO</span>
                  <div className={styles.cardStripe} style={{ background: accent }} />
                  <div className={styles.cardHeader}>
                    <div className={styles.cardUser}>
                      <div className={styles.userAvatar} style={{ background:`linear-gradient(135deg,${accent},#7c3aed)` }}>
                        {initials}
                      </div>
                      <div>
                        <div className={styles.userName}>{p.owner?.name}</div>
                        <div className={styles.userMeta}>
                          <span className="text-muted" style={{ fontSize:12 }}>{new Date(p.createdAt).toLocaleDateString()}</span>
                          {p.hackathonName && <>
                            <span className="text-muted" style={{ fontSize:11 }}>·</span>
                            <span style={{ fontSize:12, fontWeight:600, color: accent }}>{p.hackathonName}</span>
                          </>}
                        </div>
                      </div>
                    </div>
                    <div className="badge badge-purple"><Star size={10}/>{p.owner?.level || 'Dev'}</div>
                  </div>
                  <div className={styles.cardBody}>
                    <h3 className={styles.projectTitle}>{p.title}</h3>
                    <p className={styles.projectDesc}>{p.description}</p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
                      {p.techStack?.map(t => <span key={t} className="tag">{t}</span>)}
                    </div>
                    {(p.rolesNeeded?.length || 0) > 0 && (
                      <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:6, marginBottom:14 }}>
                        <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)', fontWeight:600 }}>Needs:</span>
                        {p.rolesNeeded?.map(r => <span key={r} className="badge badge-cyan">{r}</span>)}
                      </div>
                    )}
                    <div>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                        <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>Progress</span>
                        <span style={{ fontSize:13, fontWeight:700, color: accent }}>{p.progress}%</span>
                      </div>
                      <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width:`${p.progress}%`, background:`linear-gradient(90deg,${accent},#7c3aed)` }} />
                      </div>
                    </div>
                  </div>
                  <div className={styles.cardFooter}>
                    <div style={{ display:'flex', gap:4 }}>
                      <button className={styles.actionBtn}><Heart size={16} fill="none" /><span>{p.likeCount}</span></button>
                      <button className={styles.actionBtn}><MessageCircle size={16}/><span>0</span></button>
                    </div>
                    <button className="btn btn-primary btn-sm" style={{ background:`linear-gradient(135deg,${accent},#7c3aed)`, boxShadow:`0 4px 15px ${accent}40` }} disabled>
                      <UserPlus size={14}/>Join Team
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          // ── END DEMO PROJECT CARDS ─────────────────────────────────────────
        ) : (
          <div className={styles.feed}>
            {projects.map((project, idx) => {
              const accent = project.accentColor || ACCENT_COLORS[idx % ACCENT_COLORS.length];
              const liked = project.likes.includes(user?._id || '');
              const initials = project.owner?.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || '??';

              return (
                <article key={project._id} className={`glass-card ${styles.card} animate-fade-in-up delay-${Math.min(idx+1,5)}`}>
                  <div className={styles.cardStripe} style={{ background: accent }} />
                  <div className={styles.cardHeader}>
                    <div className={styles.cardUser}>
                      <div className={styles.userAvatar} style={{ background:`linear-gradient(135deg,${accent},#7c3aed)` }}>
                        {project.owner?.avatar
                          ? <img src={project.owner.avatar} alt="" style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }}/>
                          : initials}
                      </div>
                      <div>
                        <div className={styles.userName}>{project.owner?.name}</div>
                        <div className={styles.userMeta}>
                          <span className="text-muted" style={{ fontSize:12 }}>{new Date(project.createdAt).toLocaleDateString()}</span>
                          {project.hackathonName && <>
                            <span className="text-muted" style={{ fontSize:11 }}>·</span>
                            <span style={{ fontSize:12, fontWeight:600, color: accent }}>{project.hackathonName}</span>
                          </>}
                        </div>
                      </div>
                    </div>
                    <div className="badge badge-purple"><Star size={10}/>{project.owner?.level || 'Dev'}</div>
                  </div>

                  <div className={styles.cardBody}>
                    <h3 className={styles.projectTitle}>{project.title}</h3>
                    <p className={styles.projectDesc}>{project.description}</p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
                      {project.techStack.map(t => <span key={t} className="tag">{t}</span>)}
                    </div>
                    {project.rolesNeeded.length > 0 && (
                      <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:6, marginBottom:14 }}>
                        <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)', fontWeight:600 }}>Needs:</span>
                        {project.rolesNeeded.map(r => <span key={r} className="badge badge-cyan">{r}</span>)}
                      </div>
                    )}
                    <div>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                        <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>Progress</span>
                        <span style={{ fontSize:13, fontWeight:700, color: accent }}>{project.progress}%</span>
                      </div>
                      <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width:`${project.progress}%`, background:`linear-gradient(90deg,${accent},#7c3aed)` }} />
                      </div>
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    <div style={{ display:'flex', gap:4 }}>
                      <button
                        className={`${styles.actionBtn} ${liked ? styles.liked : ''}`}
                        onClick={() => handleLike(project._id)}
                        disabled={liking.has(project._id)}
                      >
                        <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
                        <span>{project.likeCount || project.likes.length}</span>
                      </button>
                      <button className={styles.actionBtn}>
                        <MessageCircle size={16}/><span>{project.comments.length}</span>
                      </button>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleJoin(project._id)}
                      style={{ background:`linear-gradient(135deg,${accent},#7c3aed)`, boxShadow:`0 4px 15px ${accent}40` }}
                    >
                      <UserPlus size={14}/>Join Team
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
