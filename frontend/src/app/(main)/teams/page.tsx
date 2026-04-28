'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Users, Shield, CheckCircle, X, Send, Crown, ChevronRight, Loader } from 'lucide-react';
import { teamsApi, hackathonsApi, usersApi, conversationsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import styles from './page.module.css';

const ACCENTS = ['#7c3aed','#06b6d4','#4ade80','#f472b6','#fb923c','#22d3ee','#60a5fa'];
const ROLES = ['Frontend Dev','Backend Dev','Full Stack Dev','ML Engineer','UI/UX Designer','Data Scientist','DevOps','Mobile Dev','Blockchain Dev','QA Engineer'];

// ── DEMO DATA ─────────────────────────────────────────────────────────────────
// Shown only when the backend returns empty lists. Remove once real data flows.
const DEMO_TEAMS: Team[] = [
  {
    _id: 'demo-t1', name: 'Quantum Coders', description: 'We are building an AI-powered code review tool that catches security bugs before they reach production. Looking for passionate devs!',
    rolesNeeded: ['ML Engineer', 'DevOps'], maxSize: 4, isOpen: true, accentColor: '#7c3aed',
    leader: { _id: 'demo-u1', name: 'Riya Kapoor', handle: 'riya_k', level: 'Elite' },
    members: [
      { user: { _id: 'demo-u1', name: 'Riya Kapoor', handle: 'riya_k' }, role: 'Full Stack Dev' },
      { user: { _id: 'demo-u2', name: 'Ankit Shah', handle: 'ankit_s' }, role: 'Frontend Dev' },
    ],
    joinRequests: [],
    hackathon: { _id: 'demo-h1', title: 'HackIndia 2025', emoji: '🇮🇳', accentColor: '#f472b6', status: 'active' },
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    _id: 'demo-t2', name: 'HealthByte', description: 'Using computer vision and wearable data to predict early signs of cardiac events. Mission-driven team with medical advisors on board.',
    rolesNeeded: ['Mobile Dev', 'UI/UX Designer'], maxSize: 5, isOpen: true, accentColor: '#06b6d4',
    leader: { _id: 'demo-u3', name: 'Aditya Rao', handle: 'aditya_r', level: 'Pro' },
    members: [
      { user: { _id: 'demo-u3', name: 'Aditya Rao', handle: 'aditya_r' }, role: 'Backend Dev' },
      { user: { _id: 'demo-u4', name: 'Meera Joshi', handle: 'meera_j' }, role: 'ML Engineer' },
      { user: { _id: 'demo-u5', name: 'Saurabh N.', handle: 'saurabh_n' }, role: 'Data Scientist' },
    ],
    joinRequests: [],
    hackathon: { _id: 'demo-h2', title: 'MLH Hack Day', emoji: '🟣', accentColor: '#7c3aed', status: 'active' },
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    _id: 'demo-t3', name: 'GreenGrid', description: 'Building a decentralised energy trading platform for rooftop solar owners. Blockchain meets renewable energy.',
    rolesNeeded: ['Blockchain Dev', 'Frontend Dev'], maxSize: 4, isOpen: false, accentColor: '#4ade80',
    leader: { _id: 'demo-u6', name: 'Kavya Menon', handle: 'kavya_m', level: 'Dev' },
    members: [
      { user: { _id: 'demo-u6', name: 'Kavya Menon', handle: 'kavya_m' }, role: 'Full Stack Dev' },
      { user: { _id: 'demo-u7', name: 'Rahul Bose', handle: 'rahul_b' }, role: 'Blockchain Dev' },
      { user: { _id: 'demo-u8', name: 'Pooja Singh', handle: 'pooja_s' }, role: 'Frontend Dev' },
      { user: { _id: 'demo-u9', name: 'Vikram Das', handle: 'vikram_d' }, role: 'DevOps' },
    ],
    joinRequests: [],
    hackathon: { _id: 'demo-h3', title: 'Devfolio Build 2025', emoji: '🔵', accentColor: '#3b82f6', status: 'upcoming' },
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

const DEMO_PEOPLE = [
  { _id: 'demo-p1', name: 'Priya Sharma', handle: 'priya_s', role: 'ML Engineer', techStack: ['Python','PyTorch','FastAPI','React'], verifiedSkills: [{name:'ML'}], stats: { hackathons: 8 }, availability: 'Available Now' },
  { _id: 'demo-p2', name: 'Arjun Mehta', handle: 'arjun_m', role: 'Full Stack Dev', techStack: ['Next.js','Node.js','MongoDB','TypeScript'], verifiedSkills: [], stats: { hackathons: 5 }, availability: 'Available Weekends' },
  { _id: 'demo-p3', name: 'Sneha Reddy', handle: 'sneha_r', role: 'UI/UX Designer', techStack: ['Figma','Framer','React','TailwindCSS'], verifiedSkills: [{name:'Design'}], stats: { hackathons: 3 }, availability: 'Available Now' },
  { _id: 'demo-p4', name: 'Karan Verma', handle: 'karan_v', role: 'DevOps Engineer', techStack: ['Docker','Kubernetes','AWS','Terraform'], verifiedSkills: [{name:'Cloud'}], stats: { hackathons: 6 }, availability: 'Busy till May' },
];
// ── END DEMO DATA ─────────────────────────────────────────────────────────────

// ── Types ──────────────────────────────────────────────────
interface TeamMember { user: { _id: string; name: string; handle: string; avatar?: string }; role: string; }
interface JoinRequest { _id: string; user: { _id: string; name: string; handle: string; avatar?: string }; message: string; status: string; }
interface Team {
  _id: string; name: string; description: string; rolesNeeded: string[];
  maxSize: number; isOpen: boolean; accentColor: string;
  leader: { _id: string; name: string; handle: string; avatar?: string; level?: string };
  members: TeamMember[];
  joinRequests: JoinRequest[];
  hackathon: { _id: string; title: string; emoji?: string; accentColor?: string; status?: string };
  createdAt: string;
}
interface Hackathon { _id: string; title: string; emoji?: string; accentColor?: string; status?: string; }

// ── Create Team Modal ──────────────────────────────────────
function CreateTeamModal({ hackathons, onClose, onCreate }: {
  hackathons: Hackathon[];
  onClose: () => void;
  onCreate: (team: Team) => void;
}) {
  const [form, setForm] = useState({ name: '', hackathonId: '', description: '', maxSize: 4, accentColor: '#7c3aed', rolesNeeded: [] as string[] });
  const [saving, setSaving] = useState(false);

  const toggleRole = (r: string) => {
    setForm(f => ({ ...f, rolesNeeded: f.rolesNeeded.includes(r) ? f.rolesNeeded.filter(x => x !== r) : [...f.rolesNeeded, r] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.hackathonId) return toast.error('Name and hackathon are required');
    setSaving(true);
    try {
      const res = await teamsApi.create(form);
      toast.success('Team created! 🐝');
      onCreate(res.data.team);
      onClose();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create team');
    } finally { setSaving(false); }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Create Your Team 🐝</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className="form-group">
            <label className="form-label">Team Name *</label>
            <input className="form-input" placeholder="e.g. Quantum Coders" value={form.name}
              onChange={e => setForm(f => ({...f, name: e.target.value}))} required/>
          </div>

          <div className="form-group">
            <label className="form-label">Hackathon *</label>
            <select className="form-input" value={form.hackathonId}
              onChange={e => setForm(f => ({...f, hackathonId: e.target.value}))} required
              style={{background:'rgba(10,10,31,0.9)',color:'white'}}>
              <option value="">Select hackathon...</option>
              {hackathons.map(h => <option key={h._id} value={h._id}>{h.emoji} {h.title}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" placeholder="What are you building? What's your vision?"
              rows={3} style={{resize:'vertical'}} value={form.description}
              onChange={e => setForm(f => ({...f, description: e.target.value}))}/>
          </div>

          <div className="form-group">
            <label className="form-label">Max Team Size</label>
            <div style={{display:'flex',gap:8}}>
              {[2,3,4,5,6].map(n => (
                <button key={n} type="button"
                  className={`${styles.sizeBtn} ${form.maxSize===n ? styles.sizeBtnActive : ''}`}
                  onClick={() => setForm(f => ({...f, maxSize: n}))}>{n}</button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Roles Needed</label>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {ROLES.map(r => (
                <button key={r} type="button"
                  className={`${styles.roleToggle} ${form.rolesNeeded.includes(r) ? styles.roleToggleActive : ''}`}
                  onClick={() => toggleRole(r)}>{r}</button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Accent Color</label>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {ACCENTS.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({...f, accentColor: c}))}
                  style={{width:28,height:28,borderRadius:'50%',background:c,border:form.accentColor===c?'3px solid white':'3px solid transparent',cursor:'pointer'}}/>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" style={{justifyContent:'center'}} disabled={saving}>
            {saving ? <><Loader size={16} className="animate-spin"/>Creating...</> : '🐝 Create Team'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Join Request Modal ─────────────────────────────────────
function JoinModal({ team, onClose, onJoined }: { team: Team; onClose: () => void; onJoined: () => void }) {
  const [message, setMessage] = useState('');
  const [role, setRole] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await teamsApi.requestJoin(team._id, message, role);
      toast.success('Join request sent! 🚀');
      onJoined();
      onClose();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to send request');
    } finally { setSending(false); }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} style={{maxWidth:440}}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Join {team.name}</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {team.rolesNeeded.length > 0 && (
            <div className="form-group">
              <label className="form-label">Apply for Role</label>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {team.rolesNeeded.map(r => (
                  <button key={r} type="button"
                    className={`${styles.roleToggle} ${role===r ? styles.roleToggleActive : ''}`}
                    onClick={() => setRole(r)}>{r}</button>
                ))}
              </div>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Message to Leader</label>
            <textarea className="form-input" placeholder="Tell them why you'd be a great addition..."
              rows={4} style={{resize:'vertical'}} value={message}
              onChange={e => setMessage(e.target.value)}/>
          </div>
          <button type="submit" className="btn btn-primary w-full" style={{justifyContent:'center'}} disabled={sending}>
            {sending ? 'Sending...' : <><Send size={15}/>Send Join Request</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Team Card ──────────────────────────────────────────────
function TeamCard({ team, currentUserId, onJoin, onMessage }: {
  team: Team; currentUserId: string;
  onJoin: (team: Team) => void;
  onMessage: (userId: string) => void;
}) {
  const accent = team.accentColor || '#7c3aed';
  const isLeader = team.leader?._id === currentUserId;
  const isMember = team.members.some(m => m.user?._id === currentUserId);
  const initials = (name: string) => name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || '??';
  const spotsLeft = team.maxSize - team.members.length;

  return (
    <article className={`glass-card ${styles.teamCard}`}>
      <div style={{height:3,background:accent}}/>
      <div className={styles.teamCardBody}>
        {/* Header */}
        <div className={styles.teamCardTop}>
          <div style={{display:'flex',alignItems:'center',gap:10,flex:1,minWidth:0}}>
            <div className={styles.teamIcon} style={{background:`${accent}22`,border:`1px solid ${accent}44`,color:accent}}>
              {team.hackathon?.emoji || '🏆'}
            </div>
            <div style={{minWidth:0}}>
              <h3 className={styles.teamName}>{team.name}</h3>
              <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                <span style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>for</span>
                <span style={{fontSize:12,fontWeight:700,color:accent}}>{team.hackathon?.title}</span>
              </div>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
            {team.isOpen
              ? <span className="badge badge-green">Open</span>
              : <span className="badge badge-purple">Full</span>}
            {(isLeader || isMember) && <span className="badge badge-cyan">{isLeader?'Leader':'Member'}</span>}
          </div>
        </div>

        {/* Description */}
        {team.description && <p className={styles.teamDesc}>{team.description}</p>}

        {/* Roles Needed */}
        {team.rolesNeeded.length > 0 && (
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>Looking For</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
              {team.rolesNeeded.map(r => <span key={r} className="badge badge-purple">{r}</span>)}
            </div>
          </div>
        )}

        {/* Members */}
        <div style={{marginBottom:14}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
            <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:'0.06em'}}>
              Team · {team.members.length}/{team.maxSize}
            </div>
            <span style={{fontSize:12,fontWeight:600,color:spotsLeft>0?accent:'rgba(255,255,255,0.3)'}}>
              {spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft>1?'s':''} left` : 'Full'}
            </span>
          </div>
          <div style={{display:'flex',gap:-6}}>
            {team.members.slice(0,6).map((m,i) => (
              <div key={i} title={m.user?.name} style={{
                width:32,height:32,borderRadius:'50%',border:`2px solid var(--bg-primary)`,
                background:`linear-gradient(135deg,${accent},#7c3aed)`,
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:11,fontWeight:700,color:'white',marginLeft:i>0?-8:0,zIndex:i,
                overflow:'hidden',cursor:'default'
              }}>
                {m.user?.avatar
                  ? <img src={m.user.avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  : initials(m.user?.name||'')}
              </div>
            ))}
            {team.members.length > 6 && (
              <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.5)',marginLeft:-8}}>
                +{team.members.length-6}
              </div>
            )}
          </div>
        </div>

        {/* Leader */}
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 0',borderTop:'var(--border-subtle)',marginBottom:14}}>
          <Crown size={13} style={{color:'#facc15'}}/>
          <div style={{width:24,height:24,borderRadius:'50%',background:`linear-gradient(135deg,${accent},#7c3aed)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:'white',overflow:'hidden'}}>
            {team.leader?.avatar ? <img src={team.leader.avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : initials(team.leader?.name||'')}
          </div>
          <span style={{fontSize:13,fontWeight:600,color:'rgba(255,255,255,0.7)'}}>{team.leader?.name}</span>
          <span className="badge badge-purple" style={{fontSize:'9px',padding:'2px 7px',marginLeft:'auto'}}>{team.leader?.level||'Dev'}</span>
        </div>

        {/* Actions */}
        <div style={{display:'flex',gap:8}}>
          {!isLeader && !isMember && team.isOpen && (
            <button className="btn btn-primary" style={{flex:1,justifyContent:'center',background:`linear-gradient(135deg,${accent},#7c3aed)`}}
              onClick={() => onJoin(team)}>
              <Users size={14}/>Join Team
            </button>
          )}
          {(isLeader || isMember) && (
            <button className="btn btn-secondary" style={{flex:1,justifyContent:'center'}}
              onClick={() => onMessage(team.leader._id)}>
              <ChevronRight size={14}/>Team Chat
            </button>
          )}
          {!isMember && !isLeader && !team.isOpen && (
            <button className="btn btn-secondary" style={{flex:1,justifyContent:'center'}} disabled>
              Team Full
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function TeamsPage() {
  const { user: me } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<'browse'|'mine'|'people'>('browse');
  const [teams, setTeams] = useState<Team[]>([]);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [people, setPeople] = useState<Array<{_id:string;name:string;handle:string;avatar?:string;role?:string;techStack?:string[];verifiedSkills?:Array<{name:string}>;stats?:{hackathons:number};availability?:string;}>>([]);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [joiningTeam, setJoiningTeam] = useState<Team | null>(null);
  const [messaging, setMessaging] = useState<Set<string>>(new Set());

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [teamsRes, hackRes] = await Promise.all([
        teamsApi.getAll({ limit: '30' }),
        hackathonsApi.getAll({ status: 'active', limit: '20' }),
      ]);
      setTeams(teamsRes.data.teams || []);
      setHackathons(hackRes.data.hackathons || []);
    } catch { toast.error('Failed to load teams'); }
    finally { setLoading(false); }
  }, []);

  const fetchMyTeams = useCallback(async () => {
    try {
      const res = await teamsApi.getMine();
      setMyTeams(res.data.teams || []);
    } catch { /* silent */ }
  }, []);

  const fetchPeople = useCallback(async () => {
    try {
      const params: Record<string,string> = { limit: '12' };
      if (search) params.search = search;
      const res = await usersApi.getAll(params);
      setPeople((res.data.users || []).filter((u: {_id:string}) => u._id !== me?._id));
    } catch { /* silent */ }
  }, [search, me?._id]);

  useEffect(() => { fetchAll(); fetchMyTeams(); }, [fetchAll, fetchMyTeams]);
  useEffect(() => { if (tab === 'people') fetchPeople(); }, [tab, fetchPeople]);

  const handleMessage = async (userId: string) => {
    setMessaging(s => new Set(s).add(userId));
    try {
      const res = await conversationsApi.getOrCreate(userId);
      router.push(`/messages?conv=${res.data.conversation._id}`);
    } catch { toast.error('Failed to open chat'); }
    finally { setMessaging(s => { const n = new Set(s); n.delete(userId); return n; }); }
  };

  const filteredTeams = teams.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.hackathon?.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`container ${styles.page}`}>
      {/* Header */}
      <div className={`${styles.header} animate-fade-in-up`}>
        <div>
          <div className={styles.badge}><Users size={13}/>Team Builder</div>
          <h1 className={styles.title}>Build Your Dream Team</h1>
          <p className={styles.sub}>Form teams, find teammates, win hackathons together</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => setShowCreate(true)}>
          <Plus size={18}/>Create Team
        </button>
      </div>

      {/* Tabs */}
      <div className={`${styles.tabs} animate-fade-in-up delay-1`}>
        {(['browse','mine','people'] as const).map(t => (
          <button key={t} className={`${styles.tab} ${tab===t?styles.tabActive:''}`} onClick={() => setTab(t)}>
            {t === 'browse' && <><Users size={14}/>Browse Teams ({teams.length})</>}
            {t === 'mine' && <><Crown size={14}/>My Teams ({myTeams.length})</>}
            {t === 'people' && <><Shield size={14}/>Find People</>}
          </button>
        ))}
      </div>

      {/* Search */}
      {(tab === 'browse' || tab === 'people') && (
        <div className={`search-input-wrap animate-fade-in-up delay-2`} style={{marginBottom:24}}>
          <Search size={18} className="search-icon"/>
          <input className="search-input" value={search} onChange={e=>setSearch(e.target.value)}
            placeholder={tab==='browse' ? 'Search teams or hackathons...' : 'Search developers by name, role, skill...'}/>
        </div>
      )}

      {/* ── Browse Teams ── */}
      {tab === 'browse' && (
        loading ? (
          <div className={styles.grid}>{[1,2,3].map(i=><div key={i} className={`glass-card ${styles.skeleton}`}/>)}</div>
        ) : filteredTeams.length === 0 ? (
          // ── DEMO TEAM CARDS (shown only when no real teams exist) ───────────
          <div className={styles.grid}>
            {/* Yellow notice banner */}
            <div style={{ gridColumn:'1/-1', display:'flex', alignItems:'center', gap:10, background:'rgba(250,204,21,0.08)', border:'1px solid rgba(250,204,21,0.25)', borderRadius:12, padding:'10px 16px' }}>
              <span style={{ fontSize:16 }}>🧪</span>
              <span style={{ fontSize:12, color:'rgba(250,204,21,0.85)', fontWeight:600 }}>Demo cards — for visual reference only. Real teams appear once users create them.</span>
              <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)} style={{ marginLeft:'auto', gap:6 }}>
                <Plus size={12}/>Create First Team
              </button>
            </div>
            {DEMO_TEAMS.map(team => (
              <div key={team._id} style={{ position:'relative' }}>
                {/* DEMO watermark */}
                <span style={{ position:'absolute', top:18, right:18, fontSize:9, fontWeight:800, background:'rgba(250,204,21,0.18)', color:'#facc15', border:'1px solid rgba(250,204,21,0.35)', borderRadius:6, padding:'2px 7px', letterSpacing:'0.08em', textTransform:'uppercase', zIndex:10 }}>DEMO</span>
                <TeamCard team={team} currentUserId="" onJoin={() => {}} onMessage={() => {}}/>
              </div>
            ))}
          </div>
          // ── END DEMO TEAM CARDS ───────────────────────────────────────────────
        ) : (
          <div className={styles.grid}>
            {filteredTeams.map(team => (
              <TeamCard key={team._id} team={team} currentUserId={me?._id||''}
                onJoin={setJoiningTeam} onMessage={handleMessage}/>
            ))}
          </div>
        )
      )}

      {/* ── My Teams ── */}
      {tab === 'mine' && (
        myTeams.length === 0 ? (
          <div className={styles.empty}>
            <div style={{fontSize:56}}>👥</div>
            <h3>You&apos;re not in any teams yet</h3>
            <p>Create a team or join one from Browse Teams</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={15}/>Create Team</button>
          </div>
        ) : (
          <div className={styles.grid}>
            {myTeams.map(team => (
              <TeamCard key={team._id} team={team} currentUserId={me?._id||''}
                onJoin={setJoiningTeam} onMessage={handleMessage}/>
            ))}
          </div>
        )
      )}

      {/* ── Find People ── */}
      {tab === 'people' && (
        <div className={styles.peopleGrid}>
          {people.length === 0 ? (
            // ── DEMO PEOPLE CARDS (shown only when no real users are returned) ───
            <>
              {/* Yellow notice banner */}
              <div style={{ gridColumn:'1/-1', display:'flex', alignItems:'center', gap:10, background:'rgba(250,204,21,0.08)', border:'1px solid rgba(250,204,21,0.25)', borderRadius:12, padding:'10px 16px', marginBottom:8 }}>
                <span style={{ fontSize:16 }}>🧪</span>
                <span style={{ fontSize:12, color:'rgba(250,204,21,0.85)', fontWeight:600 }}>Demo cards — for visual reference only. Real developers appear once users join.</span>
              </div>
              {DEMO_PEOPLE.map((dev, idx) => {
                const accent = ACCENTS[idx % ACCENTS.length];
                const initials = dev.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
                return (
                  <div key={dev._id} className={`glass-card ${styles.personCard}`} style={{ position:'relative' }}>
                    {/* DEMO watermark */}
                    <span style={{ position:'absolute', top:12, right:12, fontSize:9, fontWeight:800, background:'rgba(250,204,21,0.18)', color:'#facc15', border:'1px solid rgba(250,204,21,0.35)', borderRadius:6, padding:'2px 7px', letterSpacing:'0.08em', textTransform:'uppercase', zIndex:2 }}>DEMO</span>
                    <div className={styles.personTop}>
                      <div style={{width:46,height:46,borderRadius:'50%',background:`linear-gradient(135deg,${accent},#7c3aed)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'white',overflow:'hidden',flexShrink:0}}>
                        {initials}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <span style={{fontWeight:700,color:'white',fontSize:14}}>{dev.name}</span>
                          {(dev.verifiedSkills?.length||0)>0 && <CheckCircle size={13} style={{color:'var(--cyan-400)',flexShrink:0}}/>}
                        </div>
                        <div style={{fontSize:12,color:'rgba(255,255,255,0.4)'}}>{dev.role}</div>
                      </div>
                    </div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:4,margin:'10px 0'}}>
                      {dev.techStack?.slice(0,4).map((t,i) => (
                        <span key={t} className="tag" style={i===0?{background:`${accent}18`,borderColor:`${accent}40`,color:accent}:{}}>{t}</span>
                      ))}
                    </div>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                      <span style={{fontSize:11,color:'var(--green-400)',fontWeight:600}}>{dev.availability}</span>
                      <span style={{fontSize:11,color:'rgba(255,255,255,0.35)'}}>{dev.stats?.hackathons} hackathons</span>
                    </div>
                    <button className="btn btn-primary btn-sm" disabled
                      style={{width:'100%',justifyContent:'center',background:`linear-gradient(135deg,${accent},#7c3aed)`,opacity:0.7}}>
                      💬 Message
                    </button>
                  </div>
                );
              })}
            </>
            // ── END DEMO PEOPLE CARDS ──────────────────────────────────────────────────
          ) : people.map((dev, idx) => {
            const accent = ACCENTS[idx % ACCENTS.length];
            const initials = dev.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
            return (
              <div key={dev._id} className={`glass-card ${styles.personCard}`}>
                <div className={styles.personTop}>
                  <div style={{width:46,height:46,borderRadius:'50%',background:`linear-gradient(135deg,${accent},#7c3aed)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'white',overflow:'hidden',flexShrink:0}}>
                    {dev.avatar?<img src={dev.avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:initials}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <span style={{fontWeight:700,color:'white',fontSize:14}}>{dev.name}</span>
                      {(dev.verifiedSkills?.length||0)>0 && <CheckCircle size={13} style={{color:'var(--cyan-400)',flexShrink:0}}/>}
                    </div>
                    <div style={{fontSize:12,color:'rgba(255,255,255,0.4)'}}>{dev.role||'Developer'}</div>
                  </div>
                </div>
                {dev.techStack && dev.techStack.length > 0 && (
                  <div style={{display:'flex',flexWrap:'wrap',gap:4,margin:'10px 0'}}>
                    {dev.techStack.slice(0,4).map((t,i) => (
                      <span key={t} className="tag" style={i===0?{background:`${accent}18`,borderColor:`${accent}40`,color:accent}:{}}>{t}</span>
                    ))}
                  </div>
                )}
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                  <span style={{fontSize:11,color:'var(--green-400)',fontWeight:600}}>{dev.availability||'Available'}</span>
                  <span style={{fontSize:11,color:'rgba(255,255,255,0.35)'}}>{dev.stats?.hackathons||0} hackathons</span>
                </div>
                <button className="btn btn-primary btn-sm" style={{width:'100%',justifyContent:'center',background:`linear-gradient(135deg,${accent},#7c3aed)`}}
                  onClick={() => handleMessage(dev._id)} disabled={messaging.has(dev._id)}>
                  {messaging.has(dev._id) ? 'Opening...' : '💬 Message'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <CreateTeamModal hackathons={hackathons} onClose={() => setShowCreate(false)}
          onCreate={team => { setTeams(t => [team, ...t]); fetchMyTeams(); }}/>
      )}
      {joiningTeam && (
        <JoinModal team={joiningTeam} onClose={() => setJoiningTeam(null)} onJoined={fetchAll}/>
      )}
    </div>
  );
}
