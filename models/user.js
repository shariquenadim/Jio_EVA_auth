const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  oldPassword: {
    type: String,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(this.password, salt);

    this.password = hash;
    next();
  } catch (err) {
    next(err);
  }
});


userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.comparePasswordWithOld = function (candidatePassword) {
  if (!this.oldPassword) {
    // Return a resolved promise without performing any comparison
    return Promise.resolve(false);
  }

  return bcrypt.compare(candidatePassword, this.oldPassword);
};

module.exports = mongoose.model('User', userSchema);
