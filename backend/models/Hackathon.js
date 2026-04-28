const mongoose = require('mongoose');

const HackathonSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Hackathon title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    organizer: {
      type: String,
      required: [true, 'Organizer name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    coverImage: { type: String, default: '' },
    emoji: { type: String, default: '🏆' },
    accentColor: { type: String, default: '#7c3aed' },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    registrationDeadline: { type: Date },
    prize: {
      total: { type: String, default: '$0' },
      breakdown: { type: [String], default: [] },
    },
    tags: { type: [String], default: [] },
    maxTeamSize: { type: Number, default: 4 },
    minTeamSize: { type: Number, default: 1 },
    mode: {
      type: String,
      enum: ['online', 'in-person', 'hybrid'],
      default: 'online',
    },
    location: { type: String, default: 'Online' },
    website: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'upcoming', 'active', 'ended'],
      default: 'upcoming',
    },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
    featured: { type: Boolean, default: false },
    // ── External Source Fields ──
    isExternal: { type: Boolean, default: false },
    source: {
      type: String,
      enum: ['hackhive', 'devfolio', 'hackerearth', 'unstop', 'mlh', 'devpost'],
      default: 'hackhive',
    },
    externalId: { type: String, default: '' },   // ID on the source platform
    externalUrl: { type: String, default: '' },  // Link to original listing
    logoUrl: { type: String, default: '' },       // Platform logo / cover
  },
  { timestamps: true }
);

// ── Compound index on (source + externalId) ──────────────────────────────────
// Prevents duplicate documents during concurrent external sync runs.
// sparse: true allows multiple docs with externalId = '' (i.e. native hackathons)
HackathonSchema.index({ source: 1, externalId: 1 }, { unique: true, sparse: true });

// Virtual: participant count
HackathonSchema.virtual('participantCount').get(function () {
  return this.participants.length;
});

// Auto-update status based on dates
HackathonSchema.pre('save', function (next) {
  const now = new Date();
  if (this.status === 'draft') return next();
  if (now < this.startDate) this.status = 'upcoming';
  else if (now >= this.startDate && now <= this.endDate) this.status = 'active';
  else this.status = 'ended';
  next();
});

HackathonSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Hackathon', HackathonSchema);
