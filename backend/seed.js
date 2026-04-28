/**
 * HackHive Database Seeder
 * Run: node seed.js
 * Creates a test user + sample hackathons + sample projects
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ============================================================
// MODELS (inline for standalone script)
// ============================================================
const UserSchema = new mongoose.Schema({
  name: String, handle: String, email: String, password: String,
  avatar: String, bio: String, role: { type: String, default: 'Full Stack Developer' },
  level: { type: String, default: 'Senior' }, location: String, githubUrl: String,
  techStack: [String], verifiedSkills: [{ name: String, level: String, score: Number, verifiedAt: Date }],
  hackathonsJoined: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon' }],
  stats: { hackathons: { type: Number, default: 0 }, projects: { type: Number, default: 0 }, teammates: { type: Number, default: 0 }, wins: { type: Number, default: 0 } },
  availability: { type: String, default: 'Full-time' },
  lookingFor: String, isOnline: { type: Boolean, default: false }, lastSeen: Date,
}, { timestamps: true });

const HackathonSchema = new mongoose.Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String, organizer: String, description: String,
  emoji: String, accentColor: String,
  startDate: Date, endDate: Date, registrationDeadline: Date,
  prize: { total: String, breakdown: [String] },
  tags: [String], maxTeamSize: Number, minTeamSize: Number,
  mode: String, location: String, website: String,
  status: String, participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  featured: Boolean,
}, { timestamps: true });

const ProjectSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  hackathonName: String, title: String, description: String,
  techStack: [String], rolesNeeded: [String], progress: Number,
  repoUrl: String, demoUrl: String, accentColor: String,
  teamMembers: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, role: String }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, text: String, createdAt: Date }],
  tags: [String], isOpen: Boolean,
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Hackathon = mongoose.model('Hackathon', HackathonSchema);
const Project = mongoose.model('Project', ProjectSchema);

// ============================================================
// SEED DATA
// ============================================================

async function seed() {
  console.log('\n🌱 HackHive Database Seeder\n');

  const connectDB = require('./config/db');
  await connectDB();
  console.log('✅ MongoDB Connected\n');

  // Clear existing data (non-system data)
  await Hackathon.deleteMany({});
  await Project.deleteMany({});
  // Only delete non-system users to preserve hackhive_system
  await User.deleteMany({ handle: { $ne: 'hackhive_system' } });
  console.log('🧹 Cleared existing data\n');

  // ── SYSTEM USER (required for external hackathon sync) ──
  let systemUser = await User.findOne({ handle: 'hackhive_system' });
  if (!systemUser) {
    const sysHash = await bcrypt.hash('system_never_login_9x!', 12);
    systemUser = await User.create({
      name: 'HackHive System',
      handle: 'hackhive_system',
      email: 'system@hackhive.app',
      password: sysHash,
      role: 'System',
      level: 'Expert',
      stats: { hackathons: 0, projects: 0, teammates: 0, wins: 0 },
    });
    console.log('✅ System user created (for external hackathon sync)');
  } else {
    console.log('ℹ️  System user already exists — skipping');
  }

  // ── TEST USER ──
  const salt = await bcrypt.genSalt(12);
  const hashedPwd = await bcrypt.hash('HackHive@123', salt);

  const testUser = await User.create({
    name: 'Utkarsh Singh',
    handle: 'utkarsh',
    email: 'test@hackhive.dev',
    password: hashedPwd,
    bio: '🚀 Full-stack developer passionate about hackathons and open source. Building the future one commit at a time.',
    role: 'Full Stack Developer',
    level: 'Senior',
    location: 'India',
    githubUrl: 'https://github.com/utkarsh',
    techStack: ['React', 'Next.js', 'Node.js', 'MongoDB', 'TypeScript', 'Python', 'Docker'],
    verifiedSkills: [
      { name: 'JavaScript', level: 'Expert', score: 94, verifiedAt: new Date() },
      { name: 'React', level: 'Expert', score: 91, verifiedAt: new Date() },
      { name: 'Node.js', level: 'Advanced', score: 87, verifiedAt: new Date() },
      { name: 'MongoDB', level: 'Advanced', score: 83, verifiedAt: new Date() },
      { name: 'TypeScript', level: 'Advanced', score: 79, verifiedAt: new Date() },
    ],
    stats: { hackathons: 8, projects: 14, teammates: 23, wins: 3 },
    availability: 'Full-time',
    lookingFor: 'AI/ML hackathons and fintech projects',
    isOnline: true, lastSeen: new Date(),
  });
  console.log(`✅ Test user created: ${testUser.email}`);

  // ── EXTRA USERS (for Teams page) ──
  const extraUsers = await User.insertMany([
    {
      name: 'Aria Chen', handle: 'ariachen', email: 'aria@hackhive.dev',
      password: hashedPwd, role: 'ML Engineer', level: 'Expert', location: 'San Francisco, USA',
      bio: 'Building intelligent systems. Kaggle GM. Love NLP and computer vision.',
      techStack: ['Python', 'TensorFlow', 'PyTorch', 'FastAPI', 'Docker'],
      verifiedSkills: [
        { name: 'Python', level: 'Expert', score: 97, verifiedAt: new Date() },
        { name: 'TensorFlow', level: 'Expert', score: 93, verifiedAt: new Date() },
      ],
      stats: { hackathons: 15, projects: 22, teammates: 40, wins: 7 },
      availability: 'Weekends', isOnline: true, lastSeen: new Date(),
    },
    {
      name: 'Marcus Weber', handle: 'marcusw', email: 'marcus@hackhive.dev',
      password: hashedPwd, role: 'Blockchain Dev', level: 'Senior', location: 'Berlin, Germany',
      bio: 'Web3 pioneer. Smart contracts, DeFi protocols, NFT platforms.',
      techStack: ['Solidity', 'Rust', 'Ethereum', 'React', 'TypeScript'],
      verifiedSkills: [
        { name: 'Solidity', level: 'Expert', score: 95, verifiedAt: new Date() },
      ],
      stats: { hackathons: 12, projects: 18, teammates: 31, wins: 5 },
      availability: 'Part-time', isOnline: false, lastSeen: new Date(),
    },
    {
      name: 'Sofia Rodriguez', handle: 'sofiar', email: 'sofia@hackhive.dev',
      password: hashedPwd, role: 'UI/UX Designer + Dev', level: 'Senior', location: 'Madrid, Spain',
      bio: 'Where design meets code. Creating pixel-perfect experiences that users love.',
      techStack: ['Figma', 'React', 'CSS', 'Framer Motion', 'Vue.js'],
      verifiedSkills: [
        { name: 'React', level: 'Advanced', score: 88, verifiedAt: new Date() },
      ],
      stats: { hackathons: 9, projects: 16, teammates: 28, wins: 4 },
      availability: 'Full-time', isOnline: true, lastSeen: new Date(),
    },
    {
      name: 'Raj Patel', handle: 'rajpatel', email: 'raj@hackhive.dev',
      password: hashedPwd, role: 'DevOps Engineer', level: 'Expert', location: 'Mumbai, India',
      bio: 'Kubernetes wizard. Keeping systems at 99.99% uptime. Cloud-native everything.',
      techStack: ['Kubernetes', 'AWS', 'Terraform', 'Go', 'Python'],
      verifiedSkills: [
        { name: 'Kubernetes', level: 'Expert', score: 96, verifiedAt: new Date() },
        { name: 'AWS', level: 'Expert', score: 92, verifiedAt: new Date() },
      ],
      stats: { hackathons: 6, projects: 11, teammates: 19, wins: 2 },
      availability: 'Evenings', isOnline: false, lastSeen: new Date(),
    },
  ]);
  console.log(`✅ ${extraUsers.length} extra users created`);

  // ── HACKATHONS ──
  const now = new Date();
  const hackathons = await Hackathon.insertMany([
    {
      createdBy: testUser._id, title: 'AI for Good Hackathon 2025',
      organizer: 'Google DeepMind', description: 'Build AI solutions that tackle real-world problems — from climate change to healthcare access. $100K in prizes. 48-hour sprint.',
      emoji: '🤖', accentColor: '#06b6d4',
      startDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      prize: { total: '$100,000', breakdown: ['$50K First', '$30K Second', '$20K Third'] },
      tags: ['AI', 'Machine Learning', 'Climate', 'Healthcare'],
      maxTeamSize: 4, minTeamSize: 1, mode: 'online', location: 'Online',
      status: 'upcoming', participants: [testUser._id, ...extraUsers.slice(0, 2).map(u => u._id)],
      featured: true,
    },
    {
      createdBy: extraUsers[0]._id, title: 'Web3 Build Week',
      organizer: 'Ethereum Foundation', description: 'Shape the decentralized future. Build DApps, DeFi protocols, NFT platforms, or DAOs. No limits on creativity.',
      emoji: '⛓️', accentColor: '#7c3aed',
      startDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
      prize: { total: '$75,000', breakdown: ['$40K First', '$25K Second', '$10K Third'] },
      tags: ['Web3', 'Blockchain', 'DeFi', 'Solidity'],
      maxTeamSize: 5, minTeamSize: 2, mode: 'hybrid', location: 'Berlin + Online',
      status: 'active', participants: [extraUsers[1]._id, extraUsers[2]._id],
      featured: true,
    },
    {
      createdBy: extraUsers[1]._id, title: 'HealthTech Innovate 2025',
      organizer: 'WHO x Microsoft', description: 'Revolutionize healthcare with technology. Build tools for diagnostics, patient monitoring, telemedicine, or mental health.',
      emoji: '🏥', accentColor: '#4ade80',
      startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      prize: { total: '$50,000', breakdown: ['$25K First', '$15K Second', '$10K Third'] },
      tags: ['HealthTech', 'AI', 'Mobile', 'IoT'],
      maxTeamSize: 4, minTeamSize: 1, mode: 'online', location: 'Online',
      status: 'active', participants: [testUser._id, extraUsers[3]._id],
      featured: false,
    },
    {
      createdBy: extraUsers[2]._id, title: 'GameDev 48h Jam',
      organizer: 'Unity Technologies', description: 'Make a game in 48 hours. Any genre, any platform. Judged on creativity, fun factor, and technical execution.',
      emoji: '🎮', accentColor: '#f472b6',
      startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
      prize: { total: '$20,000', breakdown: ['$10K First', '$6K Second', '$4K Third'] },
      tags: ['Game Dev', 'Unity', 'WebGL', 'Mobile'],
      maxTeamSize: 3, minTeamSize: 1, mode: 'online', location: 'Online',
      status: 'ended', participants: [testUser._id],
      featured: false,
    },
    {
      createdBy: testUser._id, title: 'FinTech Future Sprint',
      organizer: 'Y Combinator', description: 'Disrupt the financial world. Build the next generation of payment systems, credit scoring, investment tools, or financial literacy apps.',
      emoji: '💰', accentColor: '#fb923c',
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000),
      prize: { total: '$150,000', breakdown: ['$80K First', '$50K Second', '$20K Third'] },
      tags: ['FinTech', 'Payments', 'AI', 'Blockchain'],
      maxTeamSize: 4, minTeamSize: 2, mode: 'in-person', location: 'San Francisco, USA',
      status: 'upcoming', participants: [],
      featured: true,
    },
    {
      createdBy: extraUsers[3]._id, title: 'ClimateHack Earth 2025',
      organizer: 'United Nations', description: 'Code for the planet. Climate modeling, carbon tracking, renewable energy optimization, sustainable supply chains.',
      emoji: '🌍', accentColor: '#22d3ee',
      startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
      prize: { total: '$200,000', breakdown: ['$100K First', '$70K Second', '$30K Third'] },
      tags: ['Climate', 'Sustainability', 'IoT', 'Data Science'],
      maxTeamSize: 5, minTeamSize: 2, mode: 'hybrid', location: 'Global',
      status: 'upcoming', participants: [],
      featured: true,
    },
  ]);
  console.log(`✅ ${hackathons.length} hackathons created`);

  // Update user stats
  await User.findByIdAndUpdate(testUser._id, {
    $push: { hackathonsJoined: { $each: [hackathons[0]._id, hackathons[2]._id, hackathons[3]._id] } },
  });

  // ── PROJECTS ──
  const projects = await Project.insertMany([
    {
      owner: testUser._id, hackathonName: 'AI for Good Hackathon 2025',
      title: 'MediScan AI', description: 'An AI-powered medical image analysis tool that helps doctors in rural areas diagnose diseases from X-rays and MRI scans with 94% accuracy. Built with a custom CNN trained on 500K medical images.',
      techStack: ['Python', 'TensorFlow', 'FastAPI', 'React', 'Docker'],
      rolesNeeded: ['Data Scientist', 'Mobile Dev'],
      progress: 72, accentColor: '#06b6d4',
      repoUrl: 'https://github.com/demo/mediscan', demoUrl: 'https://mediscan.demo',
      tags: ['AI', 'Healthcare', 'CNN'],
      teamMembers: [{ user: extraUsers[0]._id, role: 'ML Engineer' }],
      likes: [extraUsers[0]._id, extraUsers[1]._id, extraUsers[2]._id],
      comments: [
        { user: extraUsers[0]._id, text: 'This is incredible! The accuracy rate is mind-blowing 🔥', createdAt: new Date() },
        { user: extraUsers[1]._id, text: 'Would love to contribute to this. The impact potential is huge!', createdAt: new Date() },
      ],
      isOpen: true,
    },
    {
      owner: extraUsers[0]._id, hackathonName: 'Web3 Build Week',
      title: 'DeFi Yield Optimizer', description: 'A smart contract protocol that automatically moves your crypto assets between DeFi protocols to maximize yield. Gas-optimized, audited, and battle-tested.',
      techStack: ['Solidity', 'Hardhat', 'React', 'ethers.js', 'TypeScript'],
      rolesNeeded: ['Smart Contract Dev', 'Frontend Dev'],
      progress: 55, accentColor: '#7c3aed',
      repoUrl: 'https://github.com/demo/defi-yield',
      tags: ['Web3', 'DeFi', 'Solidity'],
      teamMembers: [{ user: extraUsers[1]._id, role: 'Frontend Dev' }],
      likes: [testUser._id, extraUsers[2]._id],
      comments: [
        { user: testUser._id, text: 'Gas optimization is 🔥 — 40% cheaper than Compound!', createdAt: new Date() },
      ],
      isOpen: true,
    },
    {
      owner: extraUsers[2]._id, hackathonName: 'HealthTech Innovate 2025',
      title: 'MindBridge', description: 'Real-time mental health companion powered by NLP. Tracks mood patterns through daily check-ins, detects early signs of anxiety/depression, and connects users to licensed therapists.',
      techStack: ['React Native', 'Python', 'BERT', 'Firebase', 'Node.js'],
      rolesNeeded: ['React Native Dev', 'Backend Dev'],
      progress: 88, accentColor: '#4ade80',
      demoUrl: 'https://mindbridge.demo',
      tags: ['Mental Health', 'NLP', 'Mobile'],
      teamMembers: [{ user: extraUsers[3]._id, role: 'Backend Dev' }],
      likes: [testUser._id, extraUsers[0]._id, extraUsers[1]._id, extraUsers[3]._id],
      comments: [
        { user: extraUsers[0]._id, text: 'Mental health tech is so important. Brilliant execution!', createdAt: new Date() },
      ],
      isOpen: false,
    },
    {
      owner: extraUsers[3]._id, hackathonName: 'GameDev 48h Jam',
      title: 'Neon Drift', description: 'A cyberpunk endless runner where you race through neon-lit corridors dodging AI enemies. Procedurally generated levels, dynamic music that reacts to gameplay speed.',
      techStack: ['Unity', 'C#', 'Blender', 'FMOD'],
      rolesNeeded: ['3D Artist', 'Sound Designer'],
      progress: 95, accentColor: '#f472b6',
      repoUrl: 'https://github.com/demo/neon-drift', demoUrl: 'https://neondrift.itch.io',
      tags: ['Game Dev', 'Cyberpunk', 'Unity'],
      teamMembers: [],
      likes: [testUser._id, extraUsers[0]._id],
      comments: [],
      isOpen: false,
    },
    {
      owner: testUser._id, hackathonName: 'FinTech Future Sprint',
      title: 'PayFlow Analytics', description: 'B2B SaaS platform that gives SMEs real-time cash flow forecasting using ML. Integrates with 200+ banks via open banking APIs. Saves CFOs 10 hours/week on financial reporting.',
      techStack: ['Next.js', 'Python', 'PostgreSQL', 'Plaid API', 'TensorFlow'],
      rolesNeeded: ['Data Engineer', 'Sales/Business'],
      progress: 40, accentColor: '#fb923c',
      tags: ['FinTech', 'SaaS', 'ML', 'Open Banking'],
      teamMembers: [],
      likes: [extraUsers[2]._id, extraUsers[3]._id],
      comments: [
        { user: extraUsers[2]._id, text: 'The Plaid integration is slick! Open banking is the future 💎', createdAt: new Date() },
      ],
      isOpen: true,
    },
  ]);
  console.log(`✅ ${projects.length} projects created`);

  await mongoose.disconnect();

  console.log('\n' + '='.repeat(55));
  console.log('🎉 Database seeded successfully!\n');
  console.log('📧 LOGIN CREDENTIALS:');
  console.log('   Email    : test@hackhive.dev');
  console.log('   Password : HackHive@123');
  console.log('\n🔗 Open: http://localhost:3000/auth/login');
  console.log('='.repeat(55) + '\n');
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
