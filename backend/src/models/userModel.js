const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    supabaseId: {
      type: String,
      required: true,
      unique: true,
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
      enum: ['client', 'editor'],
      required: true,
    },
    profile: {
      name: {
        type: String,
        trim: true,
      },
      bio: {
        type: String,
        trim: true,
      },
      avatar: {
        type: String,
      },
      portfolio: {
        type: String,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;