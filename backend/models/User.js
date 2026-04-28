const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    handle: {
      type: String,
      required: [true, 'Handle is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9_]+$/, 'Handle can only contain letters, numbers and underscores'],
      maxlength: [30, 'Handle cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      maxlength: [300, 'Bio cannot exceed 300 characters'],
      default: '',
    },
    role: {
      type: String,
      default: 'Developer',
    },
    level: {
      type: String,
      enum: ['Junior', 'Mid', 'Senior', 'Expert'],
      default: 'Mid',
    },
    location: {
      type: String,
      default: '',
    },
    githubUrl: {
      type: String,
      default: '',
    },
    githubId: {
      type: String,
      default: null,
    },
    googleId: {
      type: String,
      default: null,
    },
    techStack: {
      type: [String],
      default: [],
    },
    verifiedSkills: [
      {
        name: { type: String, required: true },
        level: {
          type: String,
          enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
          default: 'Intermediate',
        },
        score: { type: Number, min: 0, max: 100, default: 0 },
        verifiedAt: { type: Date, default: Date.now },
      },
    ],
    hackathonsJoined: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon' }],
    teamsJoined: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
    availability: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Weekends', 'Evenings', 'Not Available'],
      default: 'Full-time',
    },
    lookingFor: {
      type: String,
      default: 'Any exciting hackathon',
    },
    stats: {
      hackathons: { type: Number, default: 0 },
      projects: { type: Number, default: 0 },
      teammates: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
    },
    isVerified: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

module.exports = mongoose.model('User', UserSchema);
