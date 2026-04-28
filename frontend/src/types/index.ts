// ===================== USER =====================
export interface User {
  _id: string;
  name: string;
  handle: string;
  email: string;
  avatar: string;
  bio: string;
  role: string;
  level: 'Junior' | 'Mid' | 'Senior' | 'Expert';
  location: string;
  githubUrl: string;
  techStack: string[];
  verifiedSkills: VerifiedSkill[];
  hackathonsJoined: Hackathon[];
  stats: UserStats;
  availability: string;
  lookingFor: string;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
}

export interface VerifiedSkill {
  _id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  score: number;
  verifiedAt: string;
}

export interface UserStats {
  hackathons: number;
  projects: number;
  teammates: number;
  wins: number;
}

// ===================== AUTH =====================
export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  handle: string;
  email: string;
  password: string;
}

// ===================== PROJECT =====================
export interface Project {
  _id: string;
  owner: User;
  hackathon: Hackathon | null;
  hackathonName: string;
  title: string;
  description: string;
  techStack: string[];
  rolesNeeded: string[];
  progress: number;
  repoUrl: string;
  demoUrl: string;
  coverImage: string;
  teamMembers: TeamMember[];
  joinRequests: JoinRequest[];
  likes: string[];
  likeCount: number;
  comments: Comment[];
  tags: string[];
  isOpen: boolean;
  accentColor: string;
  createdAt: string;
}

export interface Comment {
  _id: string;
  user: User;
  text: string;
  createdAt: string;
}

export interface JoinRequest {
  _id: string;
  user: User;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface TeamMember {
  user: User;
  role: string;
  joinedAt: string;
}

// ===================== HACKATHON =====================
export interface Hackathon {
  _id: string;
  createdBy: User;
  title: string;
  organizer: string;
  description: string;
  coverImage: string;
  emoji: string;
  accentColor: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  prize: {
    total: string;
    breakdown: string[];
  };
  tags: string[];
  maxTeamSize: number;
  minTeamSize: number;
  mode: 'online' | 'in-person' | 'hybrid';
  location: string;
  website: string;
  status: 'draft' | 'upcoming' | 'active' | 'ended';
  participants: User[];
  participantCount: number;
  featured: boolean;
  createdAt: string;
}

// ===================== MESSAGES =====================
export interface Conversation {
  _id: string;
  participants: User[];
  otherParticipants: User[];
  lastMessage: Message | null;
  lastMessageAt: string;
  unread: number;
  isGroup: boolean;
  groupName: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: User;
  text: string;
  readBy: string[];
  createdAt: string;
}

// ===================== API RESPONSES =====================
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  count: number;
  total: number;
  pages: number;
  data: T[];
}
