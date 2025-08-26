import { Schema, model, Types } from 'mongoose';

const ProgressItem = new Schema({
  status: { type: String, enum: ['unchecked', 'checked', 'skipped'], default: 'unchecked' },
  note: String,
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

const ProgressSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', unique: true },
  items: { type: Map, of: ProgressItem, default: {} },
}, { timestamps: true });

export default model('Progress', ProgressSchema);
