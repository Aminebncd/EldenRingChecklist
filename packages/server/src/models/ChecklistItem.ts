import { Schema, model } from 'mongoose';

const ChecklistItem = new Schema({
  slug: { type: String, unique: true, index: true },
  title: { type: String, required: true },
  category: { type: String, index: true },
  subcategory: String,
  region: { type: String, index: true },
  tags: [String],
  prerequisites: [String],
  isUnique: { type: Boolean, default: true },
  weight: { type: Number, default: 1 },
  mapRef: { lat: Number, lng: Number, note: String },
  notes: String,
}, { timestamps: true });

export default model('ChecklistItem', ChecklistItem);
