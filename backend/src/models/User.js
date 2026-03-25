const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9._-]+$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ['Student', 'Admin'],
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
