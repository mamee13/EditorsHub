const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Update the schema
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        validator: function(el) {
          return el === this.password;
        },
        message: 'Passwords do not match'
      }
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
      default: false,
    },
    emailVerificationCode: {
      type: String,
      length: 6
    },
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
  }
);

// Replace createEmailVerificationToken with createVerificationCode
userSchema.methods.createVerificationCode = function() {
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  this.emailVerificationCode = verificationCode;
  this.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return verificationCode;
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  
  return resetToken;
};

// Remove passwordConfirm field before saving
userSchema.pre('save', function(next) {
  if (!this.isModified('password')) return next();
  this.passwordConfirm = undefined;
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;