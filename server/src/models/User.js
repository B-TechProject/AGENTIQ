/**
 * Unified User model.
 *
 * Sem 6 kept two collections for one concept: `users` (email+password) and
 * `gusers` (Google). That forced every read path to query both and pick a
 * winner (see the old auth.middleware.js), and it made "the same person signed
 * in two ways" unrepresentable. docs/02_TRD.md §9 collapses them into one
 * document with an authProviders array.
 *
 * Migration for existing data: server/scripts/migrate-users.js
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/** docs/02_TRD.md §8: bcryptjs, cost 12. Sem 6 used 10. */
export const BCRYPT_COST = 12;

const authProviderSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true, enum: ['local', 'google'] },
    // For 'local' this is the email; for 'google' it is the Google account id.
    providerId: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    displayName: { type: String, required: true, trim: true },

    // Absent for accounts created purely through Google — that is the point of
    // separating "has a password" from "is a user".
    passwordHash: { type: String, select: false },

    authProviders: {
      type: [authProviderSchema],
      default: [],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'A user must have at least one auth provider',
      },
    },

    avatarUrl: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  {
    timestamps: true,
    toJSON: {
      // Defence in depth: even if a caller forgets .select('-passwordHash'),
      // serialising a user must never emit the hash. Sem 6's registerUser
      // returned the whole mongoose document, hash included.
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  },
);

userSchema.methods.setPassword = async function setPassword(plain) {
  this.passwordHash = await bcrypt.hash(plain, BCRYPT_COST);
};

userSchema.methods.verifyPassword = async function verifyPassword(plain) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plain, this.passwordHash);
};

/**
 * Adds a provider, or reconciles an existing one.
 *
 * Matching is on (provider, email) rather than (provider, providerId) because a
 * user document is keyed by a unique email, so there is at most one account per
 * provider on it. This also repairs migrated records: Sem 6's `gusers`
 * collection never stored the Google account id, so migrate-users.js writes the
 * email as a placeholder providerId and the first real sign-in upgrades it to
 * the true id instead of appending a duplicate entry.
 */
userSchema.methods.linkProvider = function linkProvider({ provider, providerId, email }) {
  const existing = this.authProviders.find((p) => p.provider === provider && p.email === email);
  if (existing) {
    if (existing.providerId !== providerId) existing.providerId = providerId;
  } else {
    this.authProviders.push({ provider, providerId, email });
  }
  return this;
};

userSchema.methods.hasProvider = function hasProvider(provider) {
  return this.authProviders.some((p) => p.provider === provider);
};

/**
 * Collection name is explicit.
 *
 * Mongoose would pluralise 'User' to 'users' anyway — which is the same
 * collection Sem 6's email/password accounts already occupy. Stating it here
 * makes that overlap deliberate and visible rather than an accident of
 * pluralisation rules, because it is what forces migrate-users.js to be an
 * in-place upgrade of existing documents instead of a blind insert.
 */
export const USER_COLLECTION = 'users';

export const User =
  mongoose.models.User ?? mongoose.model('User', userSchema, USER_COLLECTION);
export default User;
