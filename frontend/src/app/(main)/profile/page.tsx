'use client';

import { useState } from 'react';
import { Github, MapPin, Edit3, Trophy, Code, CheckCircle, Zap, Star, Activity, Shield, Award, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi } from '@/lib/api';
import toast from 'react-hot-toast';
import styles from './page.module.css';

const TABS = ['Overview', 'Skills', 'Achievements'];

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const [tab, setTab] = useState('Overview');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: user?.bio || '',
    role: user?.role || '',
    location: user?.location || '',
    githubUrl: user?.githubUrl || '',
    availability: user?.availability || 'Full-time',
    lookingFor: user?.lookingFor || '',
  });

  if (!user) return null;

  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await usersApi.updateProfile(editForm);
      updateUser(res.data.user);
      setEditing(false);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const achievements = [
    ...(user.stats.hackathons >= 1 ? [{ emoji: '🎯', label: `${user.stats.hackathons} Hackathons Completed` }] : []),
    ...(user.stats.wins >= 1 ? [{ emoji: '🏆', label: `${user.stats.wins} Hackathon Win${user.stats.wins>1?'s':''}` }] : []),
    ...(user.stats.projects >= 5 ? [{ emoji: '🚀', label: `${user.stats.projects} Projects Built` }] : []),
    ...(user.stats.teammates >= 10 ? [{ emoji: '⭐', label: 'Top Teammate' }] : []),
    ...(user.verifiedSkills?.length >= 1 ? [{ emoji: '🛡️', label: 'AI Skill Verified' }] : []),
  ];

  return (
    <div className={`container ${styles.page}`}>
      {/* Hero */}
      <div className={`${styles.hero} animate-fade-in-up`}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <div className={styles.avatarSection}>
            <div className={styles.avatarRing}>
              {user.avatar
                ? <img src={user.avatar} alt="" className={styles.avatarImg}/>
                : <div className={styles.avatarFallback}>{initials}</div>}
            </div>
            <div className={styles.onlineStatus}><span className={styles.onlineDot}/>Available to hack</div>
          </div>

          <div className={styles.info}>
            {editing ? (
              <div className={styles.editForm}>
                <div className="form-group">
                  <label className="form-label">Role / Title</label>
                  <input className="form-input" value={editForm.role} onChange={e=>setEditForm(f=>({...f,role:e.target.value}))} placeholder="e.g. Full Stack Developer"/>
                </div>
                <div className="form-group">
                  <label className="form-label">Bio</label>
                  <textarea className="form-input" style={{resize:'vertical',minHeight:80}} value={editForm.bio} onChange={e=>setEditForm(f=>({...f,bio:e.target.value}))} placeholder="Tell the world about yourself..."/>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input className="form-input" value={editForm.location} onChange={e=>setEditForm(f=>({...f,location:e.target.value}))} placeholder="City, Country"/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Availability</label>
                    <select className="form-input" value={editForm.availability} onChange={e=>setEditForm(f=>({...f,availability:e.target.value}))}>
                      {['Full-time','Part-time','Weekends','Evenings','Not Available'].map(a=><option key={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">GitHub URL</label>
                  <input className="form-input" value={editForm.githubUrl} onChange={e=>setEditForm(f=>({...f,githubUrl:e.target.value}))} placeholder="https://github.com/yourhandle"/>
                </div>
                <div style={{display:'flex',gap:10,marginTop:4}}>
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving?'Saving...':'Save Changes'}</button>
                  <button className="btn btn-secondary" onClick={()=>setEditing(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:6}}>
                  <h1 className={styles.name}>{user.name}</h1>
                  <span className="badge badge-purple"><Star size={10}/>{user.level} Dev</span>
                </div>
                <p className={styles.role}>{user.role}</p>
                <div className={styles.meta}>
                  {user.location && <div className={styles.metaItem}><MapPin size={13}/><span>{user.location}</span></div>}
                  {user.githubUrl && <div className={styles.metaItem}><Github size={13}/><a href={user.githubUrl} target="_blank" rel="noopener" style={{color:'var(--cyan-400)',fontWeight:600}}>@{user.handle}</a></div>}
                  {user.availability && <div className={styles.metaItem}><span style={{color:'var(--green-400)',fontWeight:600}}>{user.availability}</span></div>}
                </div>
                {user.bio && <p className={styles.bio}>{user.bio}</p>}
                {user.techStack?.length > 0 && (
                  <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                    {user.techStack.map(t=><span key={t} className="tag">{t}</span>)}
                  </div>
                )}
              </>
            )}
          </div>

          <div className={styles.actions}>
            {!editing && <button className="btn btn-primary" onClick={()=>setEditing(true)}><Edit3 size={15}/>Edit Profile</button>}
            {user.githubUrl && <a href={user.githubUrl} target="_blank" rel="noopener" className="btn btn-secondary"><Github size={15}/>GitHub</a>}
            <button className="btn btn-danger btn-sm" onClick={logout}><LogOut size={15}/>Logout</button>
          </div>
        </div>

        <div className={styles.statsBar}>
          {Object.entries(user.stats).map(([k,v]) => (
            <div key={k} className={styles.statItem}>
              <span className={`gradient-text ${styles.statVal}`}>{v}</span>
              <span className={styles.statKey}>{k.charAt(0).toUpperCase()+k.slice(1)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className={`${styles.tabs} animate-fade-in-up delay-1`}>
        {TABS.map(t => (
          <button key={t} className={`${styles.tab} ${tab===t?styles.tabActive:''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in-up delay-2">
        {tab === 'Overview' && (
          <div className={styles.overviewGrid}>
            {/* Skills Panel */}
            <div className={`glass-card ${styles.panel}`}>
              <div className={styles.panelHead}>
                <div className={styles.panelIcon} style={{background:'rgba(6,182,212,0.15)',color:'var(--cyan-400)'}}><Shield size={17}/></div>
                <div><h3 className={styles.panelTitle}>AI Verified Skills</h3><p className={styles.panelSub}>Scored via AI interviews</p></div>
              </div>
              {user.verifiedSkills?.length > 0 ? (
                <div className={styles.skillsList}>
                  {user.verifiedSkills.map(s => (
                    <div key={s.name} className={styles.skillRow}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <CheckCircle size={13} style={{color:'var(--cyan-400)',flexShrink:0}}/>
                        <span className={styles.skillName}>{s.name}</span>
                        <span className="badge badge-cyan" style={{fontSize:'9px',padding:'2px 7px'}}>{s.level}</span>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{flex:1,height:5,background:'rgba(255,255,255,0.06)',borderRadius:99,overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${s.score}%`,background:'linear-gradient(90deg,var(--cyan-500),var(--purple-500))',borderRadius:99}}/>
                        </div>
                        <span style={{fontSize:12,fontWeight:700,color:'var(--cyan-400)',width:26,textAlign:'right'}}>{s.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{textAlign:'center',padding:'20px 0'}}>
                  <p style={{color:'rgba(255,255,255,0.3)',fontSize:13}}>No verified skills yet</p>
                </div>
              )}
              <button className="btn btn-secondary w-full" style={{justifyContent:'center',marginTop:16}}>
                <Zap size={14}/>Start AI Skill Interview
              </button>
            </div>

            {/* Achievements */}
            <div className={`glass-card ${styles.panel}`}>
              <div className={styles.panelHead}>
                <div className={styles.panelIcon} style={{background:'rgba(250,204,21,0.15)',color:'var(--yellow-400)'}}><Award size={17}/></div>
                <div><h3 className={styles.panelTitle}>Achievements</h3><p className={styles.panelSub}>{achievements.length} unlocked</p></div>
              </div>
              {achievements.length > 0 ? (
                <div className={styles.achievements}>
                  {achievements.map((a,i) => (
                    <div key={i} className={styles.achItem}>
                      <span style={{fontSize:20}}>{a.emoji}</span>
                      <span style={{fontSize:13,fontWeight:600,color:'rgba(255,255,255,0.75)'}}>{a.label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{textAlign:'center',padding:'20px 0'}}>
                  <p style={{color:'rgba(255,255,255,0.3)',fontSize:13}}>Complete hackathons to unlock achievements</p>
                </div>
              )}
            </div>

            {/* Activity Heatmap */}
            <div className={`glass-card ${styles.panel} ${styles.fullWidth}`}>
              <div className={styles.panelHead}>
                <div className={styles.panelIcon} style={{background:'rgba(168,85,247,0.15)',color:'var(--purple-400)'}}><Activity size={17}/></div>
                <div><h3 className={styles.panelTitle}>Build Activity</h3><p className={styles.panelSub}>30-day activity heatmap</p></div>
              </div>
              <div className={styles.heatmap}>
                {Array.from({length:35}).map((_,i) => {
                  const v = Math.random();
                  const a = v<0.3?0.05:v<0.6?0.3:v<0.85?0.6:1;
                  return <div key={i} className={styles.heatCell} style={{background:`rgba(168,85,247,${a})`,border:a>0.05?'1px solid rgba(168,85,247,0.3)':'1px solid rgba(255,255,255,0.05)'}}/>;
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 'Skills' && (
          <div className={`glass-card ${styles.panel}`} style={{padding:28}}>
            <div className={styles.panelHead}>
              <div className={styles.panelIcon} style={{background:'rgba(6,182,212,0.15)',color:'var(--cyan-400)'}}><Code size={17}/></div>
              <div><h3 className={styles.panelTitle}>All Skills</h3><p className={styles.panelSub}>Your full verified skill set</p></div>
            </div>
            {user.verifiedSkills?.length > 0 ? user.verifiedSkills.map(s => (
              <div key={s.name} className={styles.fullSkillRow}>
                <div style={{display:'flex',alignItems:'center',gap:10,width:200}}>
                  <CheckCircle size={15} style={{color:'var(--cyan-400)'}}/>
                  <div><div style={{fontWeight:700,color:'white',fontSize:15}}>{s.name}</div><div style={{fontSize:12,color:'rgba(255,255,255,0.4)'}}>{s.level}</div></div>
                </div>
                <div style={{flex:1,display:'flex',alignItems:'center',gap:12}}>
                  <div style={{flex:1,height:7,background:'rgba(255,255,255,0.05)',borderRadius:99,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${s.score}%`,background:'linear-gradient(90deg,var(--cyan-500),var(--purple-500))',borderRadius:99}}/>
                  </div>
                  <span style={{fontSize:13,fontWeight:700,color:'var(--cyan-400)',width:56,textAlign:'right'}}>{s.score}/100</span>
                </div>
              </div>
            )) : <p style={{color:'rgba(255,255,255,0.3)',fontSize:14}}>Take an AI interview to verify your skills!</p>}
            <div style={{marginTop:24,padding:18,background:'rgba(168,85,247,0.06)',border:'1px solid rgba(168,85,247,0.2)',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <Zap size={20} style={{color:'var(--purple-400)'}}/>
                <div><div style={{fontSize:15,fontWeight:700,color:'white'}}>Verify More Skills</div><div style={{fontSize:13,color:'rgba(255,255,255,0.4)'}}>Take a 10-min AI interview</div></div>
              </div>
              <button className="btn btn-primary">Start Interview</button>
            </div>
          </div>
        )}

        {tab === 'Achievements' && (
          <div className={`glass-card ${styles.panel}`} style={{padding:28}}>
            <div className={styles.panelHead}>
              <div className={styles.panelIcon} style={{background:'rgba(250,204,21,0.15)',color:'var(--yellow-400)'}}><Trophy size={17}/></div>
              <div><h3 className={styles.panelTitle}>All Achievements</h3><p className={styles.panelSub}>Your hackathon milestones</p></div>
            </div>
            {achievements.length > 0 ? (
              <div className={styles.achGrid}>
                {achievements.map((a,i) => (
                  <div key={i} className={styles.achBig}>
                    <div style={{fontSize:36}}>{a.emoji}</div>
                    <div style={{fontSize:13,fontWeight:600,color:'rgba(255,255,255,0.7)',textAlign:'center'}}>{a.label}</div>
                    <span className="badge badge-purple">Unlocked</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{textAlign:'center',padding:'40px 0'}}>
                <div style={{fontSize:48,marginBottom:12}}>🏆</div>
                <p style={{color:'rgba(255,255,255,0.4)',fontSize:14}}>No achievements yet — join a hackathon to start unlocking them!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
