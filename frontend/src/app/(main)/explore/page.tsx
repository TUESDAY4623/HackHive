'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Calendar, Users, Trophy, ArrowRight, Sparkles, RefreshCw, ExternalLink, Zap } from 'lucide-react';
import { hackathonsApi } from '@/lib/api';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Hackathon } from '@/types';
import toast from 'react-hot-toast';
import styles from './page.module.css';

const STATUS_FILTERS = ['All', 'upcoming', 'active', 'ended'];

// Source branding config
const SOURCE_META: Record<string, { label: string; color: string; logo: string }> = {
  devfolio:    { label: 'Devfolio',     color: '#3b82f6', logo: '🔵' },
  hackerearth: { label: 'HackerEarth', color: '#22d3ee', logo: '🟢' },
  unstop:      { label: 'Unstop',       color: '#f472b6', logo: '🔴' },
  mlh:         { label: 'MLH',          color: '#7c3aed', logo: '🟣' },
  devpost:     { label: 'Devpost',      color: '#fb923c', logo: '🟠' },
  hackhive:    { label: 'HackHive',     color: '#4ade80', logo: '🐝' },
};

// ── DEMO DATA ─────────────────────────────────────────────────────────────────
// Shown only when the backend returns 0 hackathons. Remove once real data flows.
const DEMO_HACKATHON_CARDS: (Hackathon & { source?: string; isExternal?: boolean; externalUrl?: string; logoUrl?: string })[] = [
  {
    _id: 'demo-explore-h1',
    title: 'HackIndia 2025 — National Finals',
    organizer: 'HackIndia Foundation',
    description: 'India’s largest student hackathon. 72 hours of building, pitching, and winning. Open to all undergrads.',
    tags: ['AI/ML', 'Web3', 'Open Innovation', 'HealthTech'],
    status: 'active',
    startDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 4 * 86400000).toISOString(),
    participantCount: 3420,
    participants: [],
    prize: { total: '₹10,00,000', breakdown: [] },
    accentColor: '#f472b6',
    emoji: '🇮🇳',
    source: 'devfolio',
    isExternal: false,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'demo-explore-h2',
    title: 'MLH Local Hack Day — Spring Edition',
    organizer: 'Major League Hacking',
    description: 'A 24-hour beginner-friendly hackathon celebrating learning, building, and community. Remote-first.',
    tags: ['Beginner Friendly', 'Hardware', 'Open Source'],
    status: 'upcoming',
    startDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 8 * 86400000).toISOString(),
    participantCount: 890,
    participants: [],
    prize: { total: '$5,000', breakdown: [] },
    accentColor: '#7c3aed',
    emoji: '🟣',
    source: 'mlh',
    isExternal: true,
    externalUrl: 'https://mlh.io',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'demo-explore-h3',
    title: 'Devfolio Build 2025',
    organizer: 'Devfolio',
    description: 'Build products that matter. Devfolio’s flagship hackathon brings together the best hackers for a 48-hour sprint.',
    tags: ['Product', 'SaaS', 'B2B', 'Fintech'],
    status: 'upcoming',
    startDate: new Date(Date.now() + 14 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 16 * 86400000).toISOString(),
    participantCount: 1200,
    participants: [],
    prize: { total: '$25,000', breakdown: [] },
    accentColor: '#3b82f6',
    emoji: '🔵',
    source: 'devfolio',
    isExternal: true,
    externalUrl: 'https://devfolio.co',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'demo-explore-h4',
    title: 'Smart India Hackathon 2025',
    organizer: 'MoE, Govt. of India',
    description: 'A nationwide initiative to provide students with a platform to solve pressing problems in society, organisations, and government.',
    tags: ['GovTech', 'Social Impact', 'Education', 'Agriculture'],
    status: 'ended',
    startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
    endDate: new Date(Date.now() - 28 * 86400000).toISOString(),
    participantCount: 52000,
    participants: [],
    prize: { total: '₹1,00,000', breakdown: [] },
    accentColor: '#facc15',
    emoji: '⚡',
    source: 'hackhive',
    isExternal: false,
    createdAt: new Date().toISOString(),
  },
];
// ── END DEMO DATA ─────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const { user } = useAuth();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [registering, setRegistering] = useState<Set<string>>(new Set());

  const sources = ['All', ...Object.keys(SOURCE_META)];

  const fetchHackathons = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '50' };
      if (search) params.search = search;
      if (status !== 'All') params.status = status;
      const res = await hackathonsApi.getAll(params);
      let data: Hackathon[] = res.data.hackathons || [];
      if (sourceFilter !== 'All') {
        data = data.filter(h => (h as Hackathon & { source?: string }).source === sourceFilter);
      }
      setHackathons(data);
    } catch { toast.error('Failed to load hackathons'); }
    finally { setLoading(false); }
  }, [search, status, sourceFilter]);

  useEffect(() => {
    const t = setTimeout(fetchHackathons, 300);
    return () => clearTimeout(t);
  }, [fetchHackathons]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/sync/hackathons');
      toast.success(`🔄 ${res.data.message}`);
      fetchHackathons();
    } catch {
      toast.error('Sync failed — check backend logs');
    } finally {
      setSyncing(false);
    }
  };

  const handleRegister = async (hackathon: Hackathon) => {
    setRegistering(s => new Set(s).add(hackathon._id));
    try {
      const res = await hackathonsApi.register(hackathon._id);
      toast.success(res.data.message);
      setHackathons(prev => prev.map(h => {
        if (h._id !== hackathon._id) return h;
        const isReg = h.participants.some(p => (typeof p === 'string' ? p : p._id) === user?._id);
        return {
          ...h,
          participantCount: isReg ? h.participantCount - 1 : h.participantCount + 1,
          participants: isReg
            ? h.participants.filter(p => (typeof p === 'string' ? p : p._id) !== user?._id)
            : [...h.participants, user as never],
        };
      }));
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error');
    } finally { setRegistering(s => { const n = new Set(s); n.delete(hackathon._id); return n; }); }
  };

  const externalCount = hackathons.filter(h => (h as Hackathon & { isExternal?: boolean }).isExternal).length;

  return (
    <div className={`container ${styles.page}`}>
      <div className={`${styles.header} animate-fade-in-up`}>
        <div>
          <div className={styles.badge}><Sparkles size={13}/>Discover</div>
          <h1 className={styles.title}>Explore Hackathons</h1>
          <p className={styles.sub}>
            Real-time data from <span style={{color:'#3b82f6',fontWeight:700}}>Devfolio</span>,{' '}
            <span style={{color:'#22d3ee',fontWeight:700}}>HackerEarth</span>,{' '}
            <span style={{color:'#f472b6',fontWeight:700}}>Unstop</span> &amp;{' '}
            <span style={{color:'#7c3aed',fontWeight:700}}>MLH</span>
          </p>
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:10}}>
          <div className={styles.stats}>
            <div className={styles.statChip}>
              <span className="gradient-text" style={{fontSize:26,fontWeight:800}}>{hackathons.filter(h=>h.status==='active').length}</span>
              <span style={{fontSize:11,color:'rgba(255,255,255,0.4)',fontWeight:600}}>Live Now</span>
            </div>
            <div className={styles.statChip}>
              <span className="gradient-text" style={{fontSize:26,fontWeight:800}}>{hackathons.length}</span>
              <span style={{fontSize:11,color:'rgba(255,255,255,0.4)',fontWeight:600}}>Total</span>
            </div>
            {externalCount > 0 && (
              <div className={styles.statChip}>
                <span style={{fontSize:26,fontWeight:800,color:'#4ade80'}}>{externalCount}</span>
                <span style={{fontSize:11,color:'rgba(255,255,255,0.4)',fontWeight:600}}>External</span>
              </div>
            )}
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleSync}
            disabled={syncing}
            style={{borderColor:'rgba(74,222,128,0.3)',color:'var(--green-400)',gap:6}}
          >
            <Zap size={13}/>{syncing ? 'Syncing...' : 'Sync Live Data'}
            <RefreshCw size={13} className={syncing ? 'animate-spin' : ''}/>
          </button>
        </div>
      </div>

      <div className={`${styles.searchRow} animate-fade-in-up delay-1`}>
        <div className="search-input-wrap" style={{flex:1}}>
          <Search size={18} className="search-icon"/>
          <input className="search-input" placeholder="Search hackathons, organizers, tags..."
            value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <button onClick={fetchHackathons} className="btn btn-secondary">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''}/>
        </button>
      </div>

      {/* Status Filters */}
      <div className={`${styles.filterRow} animate-fade-in-up delay-2`}>
        {STATUS_FILTERS.map(f => (
          <button key={f} className={`${styles.pill} ${status===f ? styles.pillActive : ''}`} onClick={() => setStatus(f)}>
            {f === 'active' && <span style={{width:6,height:6,background:'var(--green-400)',borderRadius:'50%',display:'inline-block',animation:'pulse 2s infinite'}}/>}
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
        <div style={{width:1,height:24,background:'rgba(255,255,255,0.08)',margin:'0 4px'}}/>
        {/* Source Filters */}
        {sources.map(s => {
          const meta = SOURCE_META[s];
          return (
            <button
              key={s}
              className={`${styles.pill} ${sourceFilter===s ? styles.pillSourceActive : ''}`}
              onClick={() => setSourceFilter(s)}
              style={sourceFilter===s && meta ? {borderColor: meta.color+'60', color: meta.color, background: meta.color+'15'} : {}}
            >
              {meta ? <span>{meta.logo}</span> : null}
              {s === 'All' ? 'All Sources' : meta?.label || s}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className={styles.grid}>{[1,2,3,4,5,6].map(i=><div key={i} className={`glass-card ${styles.skeleton}`}/>)}</div>
      ) : hackathons.length === 0 ? (
        // ── DEMO HACKATHON CARDS (shown only when no real hackathons exist) ──────
        <div className={styles.grid}>
          {/* Yellow notice banner */}
          <div style={{ gridColumn:'1/-1', display:'flex', alignItems:'center', gap:10, background:'rgba(250,204,21,0.08)', border:'1px solid rgba(250,204,21,0.25)', borderRadius:12, padding:'10px 16px' }}>
            <span style={{ fontSize:16 }}>🧪</span>
            <span style={{ fontSize:12, color:'rgba(250,204,21,0.85)', fontWeight:600 }}>Demo cards — for visual reference only. Sync live data or add hackathons to see real entries.</span>
            <button className="btn btn-secondary btn-sm" onClick={handleSync} disabled={syncing} style={{ marginLeft:'auto', borderColor:'rgba(74,222,128,0.3)', color:'var(--green-400)', gap:6 }}>
              <Zap size={12}/>{syncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
          {DEMO_HACKATHON_CARDS.map((h, idx) => {
            const srcMeta = SOURCE_META[h.source || 'hackhive'] || SOURCE_META.hackhive;
            return (
              <article key={h._id} className={`glass-card ${styles.card} animate-fade-in-up delay-${Math.min(idx+1,5)}`} style={{ position:'relative' }}>
                {/* DEMO watermark badge */}
                <span style={{ position:'absolute', top:14, right:14, fontSize:9, fontWeight:800, background:'rgba(250,204,21,0.18)', color:'#facc15', border:'1px solid rgba(250,204,21,0.35)', borderRadius:6, padding:'2px 7px', letterSpacing:'0.08em', textTransform:'uppercase', zIndex:2 }}>DEMO</span>
                <div style={{height:3,background:h.accentColor||'#7c3aed'}}/>
                <div className={styles.cardTop}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div className={styles.emoji} style={{background:(h.accentColor||'#7c3aed')+'22',border:`1px solid ${h.accentColor||'#7c3aed'}44`}}>{h.emoji||'🏆'}</div>
                    <span className={styles.sourceBadge} style={{background:srcMeta.color+'18',borderColor:srcMeta.color+'40',color:srcMeta.color}}>
                      {srcMeta.logo} {srcMeta.label}
                    </span>
                  </div>
                  <span className={`badge ${h.status==='active'?'badge-green':h.status==='upcoming'?'badge-cyan':'badge-purple'}`}>
                    {h.status==='active'&&<span style={{width:6,height:6,background:'var(--green-400)',borderRadius:'50%',display:'inline-block',animation:'ping 1.5s infinite'}}/>}
                    {h.status}
                  </span>
                </div>
                <div className={styles.cardBody}>
                  <h3 className={styles.hackTitle}>{h.title}</h3>
                  <p style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginBottom:8}}>by {h.organizer}</p>
                  <p style={{fontSize:13,color:'rgba(255,255,255,0.55)',lineHeight:1.6,marginBottom:12}}>{h.description}</p>
                  <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                    {h.tags.map(t=><span key={t} className="tag">{t}</span>)}
                  </div>
                </div>
                <div className={styles.cardMeta}>
                  <div className={styles.metaItem}><Calendar size={14} style={{color:h.accentColor}}/><span>{new Date(h.startDate).toLocaleDateString()} – {new Date(h.endDate).toLocaleDateString()}</span></div>
                  <div className={styles.metaItem}><Users size={14} style={{color:h.accentColor}}/><span>{h.participantCount} hackers</span></div>
                  <div className={styles.metaItem}><Trophy size={14} style={{color:h.accentColor}}/><span style={{fontWeight:700,color:h.accentColor}}>{h.prize?.total||'TBD'}</span></div>
                </div>
                <div className={styles.cardFooter}>
                  {h.isExternal && h.externalUrl && (
                    <a href={h.externalUrl} target="_blank" rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{borderColor:srcMeta.color+'40',color:srcMeta.color,gap:5}}>
                      <ExternalLink size={13}/>View
                    </a>
                  )}
                  <button className="btn btn-primary" disabled
                    style={{flex:1,justifyContent:'center',background:`linear-gradient(135deg,${h.accentColor||'#7c3aed'},#7c3aed)`,boxShadow:`0 4px 15px ${h.accentColor||'#7c3aed'}40`,opacity:0.7}}>
                    {h.status==='ended' ? 'Ended' : 'Register Now'}
                    {h.status!=='ended' && <ArrowRight size={16}/>}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        // ── END DEMO HACKATHON CARDS ───────────────────────────────────────────────
      ) : (
        <div className={styles.grid}>
          {hackathons.map((h, idx) => {
            const isReg = h.participants?.some(p => (typeof p === 'string' ? p : p._id) === user?._id);
            const hExt = h as Hackathon & { source?: string; isExternal?: boolean; externalUrl?: string; logoUrl?: string };
            const srcMeta = SOURCE_META[hExt.source || 'hackhive'] || SOURCE_META.hackhive;

            return (
              <article key={h._id} className={`glass-card ${styles.card} animate-fade-in-up delay-${Math.min(idx+1,5)}`}>
                <div style={{height:3,background:h.accentColor||'#7c3aed'}}/>

                {/* Cover Image */}
                {hExt.logoUrl && (
                  <div style={{height:90,overflow:'hidden',background:'rgba(0,0,0,0.3)'}}>
                    <img src={hExt.logoUrl} alt={h.title} style={{width:'100%',height:'100%',objectFit:'cover',opacity:0.7}}/>
                  </div>
                )}

                <div className={styles.cardTop}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    {!hExt.logoUrl && (
                      <div className={styles.emoji} style={{background:(h.accentColor||'#7c3aed')+'22',border:`1px solid ${h.accentColor||'#7c3aed'}44`}}>{h.emoji||'🏆'}</div>
                    )}
                    {/* Source Badge */}
                    <span className={styles.sourceBadge} style={{background:srcMeta.color+'18',borderColor:srcMeta.color+'40',color:srcMeta.color}}>
                      {srcMeta.logo} {srcMeta.label}
                    </span>
                  </div>
                  <span className={`badge ${h.status==='active'?'badge-green':h.status==='upcoming'?'badge-cyan':'badge-purple'}`}>
                    {h.status==='active'&&<span style={{width:6,height:6,background:'var(--green-400)',borderRadius:'50%',display:'inline-block',animation:'ping 1.5s infinite'}}/>}
                    {h.status}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.hackTitle}>{h.title}</h3>
                  <p style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginBottom:8}}>by {h.organizer}</p>
                  <p style={{fontSize:13,color:'rgba(255,255,255,0.55)',lineHeight:1.6,marginBottom:12}}>{h.description}</p>
                  <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                    {h.tags.map(t=><span key={t} className="tag">{t}</span>)}
                  </div>
                </div>

                <div className={styles.cardMeta}>
                  <div className={styles.metaItem}><Calendar size={14} style={{color:h.accentColor}}/><span>{new Date(h.startDate).toLocaleDateString()} – {new Date(h.endDate).toLocaleDateString()}</span></div>
                  <div className={styles.metaItem}><Users size={14} style={{color:h.accentColor}}/><span>{h.participantCount||h.participants?.length||0} hackers</span></div>
                  <div className={styles.metaItem}><Trophy size={14} style={{color:h.accentColor}}/><span style={{fontWeight:700,color:h.accentColor}}>{h.prize?.total||'TBD'}</span></div>
                </div>

                <div className={styles.cardFooter}>
                  {/* External Link */}
                  {hExt.isExternal && hExt.externalUrl && (
                    <a
                      href={hExt.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{borderColor:srcMeta.color+'40',color:srcMeta.color,gap:5}}
                    >
                      <ExternalLink size={13}/>View
                    </a>
                  )}
                  <button
                    className="btn btn-primary"
                    style={{flex:1,justifyContent:'center',background:`linear-gradient(135deg,${h.accentColor||'#7c3aed'},#7c3aed)`,boxShadow:`0 4px 15px ${h.accentColor||'#7c3aed'}40`}}
                    onClick={() => handleRegister(h)}
                    disabled={h.status==='ended'||registering.has(h._id)}
                  >
                    {h.status==='ended' ? 'Ended' : isReg ? '✓ Registered' : 'Register Now'}
                    {h.status!=='ended' && !isReg && <ArrowRight size={16}/>}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
