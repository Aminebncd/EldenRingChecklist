import { Schema, model } from 'mongoose';

const UserSchema = new Schema(
  {
    email: { type: String, unique: true, required: true, index: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
  },
  { timestamps: true }
);

export const UserModel = model('User', UserSchema);
export default UserModel;
