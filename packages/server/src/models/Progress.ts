import { Schema, model, Types } from 'mongoose';

const ItemStatusSchema = new Schema(
  {
    status: {
      type: String,
      enum: ['unchecked', 'checked', 'skipped'],
      required: true
    },
    note: { type: String },
    updatedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const ProgressSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', unique: true, index: true },
    items: { type: Map, of: ItemStatusSchema, default: {} }
  },
  { timestamps: true }
);

export const ProgressModel = model('Progress', ProgressSchema);
export default ProgressModel;
