import { Schema, model } from 'mongoose';

const UserSchema = new Schema({
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  displayName: String,
  role: { type: String, default: 'user' },
}, { timestamps: true });

export default model('User', UserSchema);
