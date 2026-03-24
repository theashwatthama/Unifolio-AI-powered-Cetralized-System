const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Hackathon', 'Internship', 'Sports', 'Course'],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    hasProof: {
      type: Boolean,
      default: false,
    },
    proofFileUrl: {
      type: String,
      default: '',
    },
    proofFileName: {
      type: String,
      default: '',
    },
    proofFileType: {
      type: String,
      default: '',
    },
    verified: {
      type: Boolean,
      default: false,
      index: true,
    },
    rejected: {
      type: Boolean,
      default: false,
      index: true,
    },
    verifiedBadge: {
      type: Boolean,
      default: false,
    },
    score: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Achievement', achievementSchema);
