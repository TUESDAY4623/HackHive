'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Send, Phone, Video, MoreVertical, ArrowLeft, Smile } from 'lucide-react';
import { conversationsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Conversation, Message } from '@/types';
import { getSocket, joinConversation, leaveConversation, emitTypingStart, emitTypingStop } from '@/lib/socket';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import styles from './page.module.css';

export default function MessagesPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<NodeJS.Timeout | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await conversationsApi.getAll();
      setConversations(res.data.conversations || []);
    } catch { toast.error('Failed to load conversations'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Auto-select from URL param
  useEffect(() => {
    const convId = searchParams.get('conv');
    if (convId) setSelected(convId);
  }, [searchParams]);

  // Load messages when conversation selected
  useEffect(() => {
    if (!selected) return;
    const socket = getSocket();

    conversationsApi.getMessages(selected).then(res => {
      setMessages(res.data.messages || []);
      fetchConversations();
    }).catch(() => toast.error('Failed to load messages'));

    joinConversation(selected);

    // Listen for new messages via socket
    const handleNewMsg = (msg: Message) => {
      if (msg.conversation === selected) {
        setMessages(prev => [...prev, msg]);
      } else {
        fetchConversations();
        toast(`New message from ${msg.sender?.name}`, { icon: '💬' });
      }
    };

    const handleTypingStart = ({ conversationId, name }: { conversationId: string; name: string }) => {
      if (conversationId === selected) setOtherTyping(true);
    };
    const handleTypingStop = ({ conversationId }: { conversationId: string }) => {
      if (conversationId === selected) setOtherTyping(false);
    };

    socket?.on('message:new', handleNewMsg);
    socket?.on('typing:start', handleTypingStart);
    socket?.on('typing:stop', handleTypingStop);

    return () => {
      leaveConversation(selected);
      socket?.off('message:new', handleNewMsg);
      socket?.off('typing:start', handleTypingStart);
      socket?.off('typing:stop', handleTypingStop);
    };
  }, [selected, fetchConversations]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTyping = (val: string) => {
    setNewMsg(val);
    if (!typing) {
      setTyping(true);
      emitTypingStart(selected!);
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setTyping(false);
      emitTypingStop(selected!);
    }, 1500);
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !selected || sending) return;
    const text = newMsg;
    setNewMsg('');
    setSending(true);
    try {
      const res = await conversationsApi.sendMessage(selected, text);
      setMessages(prev => [...prev, res.data.message]);
      fetchConversations();
    } catch { toast.error('Failed to send message'); setNewMsg(text); }
    finally { setSending(false); }
  };

  const selectedConv = conversations.find(c => c._id === selected);
  const otherUser = selectedConv?.otherParticipants?.[0];

  const filteredConvs = conversations.filter(c =>
    c.otherParticipants?.[0]?.name?.toLowerCase().includes(search.toLowerCase()) ||
    (c.lastMessage as Message | null)?.text?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.layout}>
        {/* Sidebar */}
        <aside className={`${styles.sidebar} ${selected ? styles.sidebarHidden : ''}`}>
          <div className={styles.sidebarHeader}>
            <h1 className={styles.sidebarTitle}>Messages</h1>
            <div className={styles.unreadPill}>
              {conversations.reduce((a,c)=>a+(c.unread||0),0)} new
            </div>
          </div>
          <div style={{padding:'0 14px 12px'}}>
            <div className="search-input-wrap">
              <Search size={16} className="search-icon"/>
              <input className="search-input" placeholder="Search..." value={search}
                onChange={e=>setSearch(e.target.value)} style={{padding:'9px 14px 9px 36px',fontSize:13}}/>
            </div>
          </div>
          <div className={styles.convList}>
            {loading ? <div style={{padding:20,textAlign:'center',color:'rgba(255,255,255,0.3)'}}>Loading...</div>
            : filteredConvs.length === 0 ? (
              <div style={{padding:'40px 20px',textAlign:'center',color:'rgba(255,255,255,0.3)'}}>
                <p>No conversations yet</p>
                <p style={{fontSize:12,marginTop:8}}>Message someone from the Teams page</p>
              </div>
            ) : filteredConvs.map(conv => {
              const other = conv.otherParticipants?.[0];
              const initials = other?.name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase();
              const isActive = selected === conv._id;
              return (
                <button key={conv._id} className={`${styles.convItem} ${isActive ? styles.convActive : ''}`}
                  onClick={() => setSelected(conv._id)}>
                  <div className={styles.convAvatarWrap}>
                    <div className={styles.convAvatar} style={{background:isActive?'var(--gradient-primary)':'linear-gradient(135deg,#3b3b6b,#1e1e3f)'}}>
                      {other?.avatar ? <img src={other.avatar} alt="" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}}/> : initials}
                    </div>
                    {other?.isOnline && <div className={styles.onlineDot}/>}
                  </div>
                  <div className={styles.convContent}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                      <span className={styles.convName}>{other?.name || 'Unknown'}</span>
                      <span style={{fontSize:11,color:'rgba(255,255,255,0.3)'}}>{conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : ''}</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',gap:8}}>
                      <span className={styles.convPreview}>{(conv.lastMessage as Message | null)?.text || 'No messages yet'}</span>
                      {conv.unread > 0 && <span className={styles.unreadBadge}>{conv.unread}</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Chat */}
        <div className={`${styles.chat} ${!selected ? styles.chatHidden : ''}`}>
          {selected && otherUser ? (
            <>
              <div className={styles.chatHeader}>
                <button className={styles.backBtn} onClick={() => setSelected(null)}><ArrowLeft size={20}/></button>
                <div className={styles.chatAvatarWrap}>
                  <div className={styles.chatAvatar}>
                    {otherUser.avatar ? <img src={otherUser.avatar} alt="" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}}/> : otherUser.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  {otherUser.isOnline && <div className={styles.chatOnlineDot}/>}
                </div>
                <div style={{flex:1}}>
                  <div className={styles.chatName}>{otherUser.name}</div>
                  <div className={styles.chatStatus}>{otherUser.isOnline ? <><span style={{display:'inline-block',width:6,height:6,background:'var(--green-400)',borderRadius:'50%'}}/>Online</> : 'Offline'}</div>
                </div>
                <div style={{display:'flex',gap:4}}>
                  <button className="btn btn-ghost btn-sm"><Phone size={17}/></button>
                  <button className="btn btn-ghost btn-sm"><Video size={17}/></button>
                  <button className="btn btn-ghost btn-sm"><MoreVertical size={17}/></button>
                </div>
              </div>

              <div className={styles.msgList}>
                {messages.map((msg, i) => {
                  const isMe = msg.sender?._id === user?._id;
                  const initials = msg.sender?.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
                  return (
                    <div key={msg._id||i} className={`${styles.msgWrap} ${isMe ? styles.msgMe : ''}`}>
                      {!isMe && <div className={styles.msgAvatar}>{msg.sender?.avatar ? <img src={msg.sender.avatar} alt="" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}}/> : initials}</div>}
                      <div className={`${styles.bubble} ${isMe ? styles.bubbleMe : styles.bubbleThem}`}>
                        <p className={styles.bubbleText}>{msg.text}</p>
                        <span className={styles.bubbleTime}>{new Date(msg.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                      </div>
                    </div>
                  );
                })}
                {otherTyping && (
                  <div className={styles.msgWrap}>
                    <div className={styles.msgAvatar}>...</div>
                    <div className={`${styles.bubble} ${styles.bubbleThem}`} style={{padding:'10px 14px'}}>
                      <span style={{color:'rgba(255,255,255,0.4)',fontSize:13}}>typing...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef}/>
              </div>

              <div className={styles.inputArea}>
                <div className={styles.inputWrap}>
                  <input className={styles.chatInput} placeholder="Type a message..." value={newMsg}
                    onChange={e => handleTyping(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}/>
                  <button className={styles.emojiBtn}><Smile size={17}/></button>
                </div>
                <button className={`btn btn-primary ${styles.sendBtn}`} onClick={sendMessage} disabled={!newMsg.trim()||sending}>
                  <Send size={16}/>
                </button>
              </div>
            </>
          ) : (
            <div className={styles.emptyChatState}>
              <div style={{fontSize:60,opacity:0.3}}>💬</div>
              <h3>Select a conversation</h3>
              <p>Choose from your messages on the left, or message someone from Teams</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
