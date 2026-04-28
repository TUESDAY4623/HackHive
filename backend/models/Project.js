const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hackathon',
      default: null,
    },
    hackathonName: { type: String, default: '' },
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    techStack: {
      type: [String],
      default: [],
    },
    rolesNeeded: {
      type: [String],
      default: [],
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    repoUrl: { type: String, default: '' },
    demoUrl: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    teamMembers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, default: 'Member' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    joinRequests: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        message: { type: String, default: '' },
        status: {
          type: String,
          enum: ['pending', 'accepted', 'rejected'],
          default: 'pending',
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, required: true, maxlength: 500 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    tags: { type: [String], default: [] },
    isOpen: { type: Boolean, default: true }, // open to new members
    accentColor: { type: String, default: '#7c3aed' },
  },
  { timestamps: true }
);

// Virtual for like count
ProjectSchema.virtual('likeCount').get(function () {
  return this.likes.length;
});

ProjectSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Project', ProjectSchema);
