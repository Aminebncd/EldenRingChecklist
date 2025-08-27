import { Schema, model } from 'mongoose';

const ChecklistItemSchema = new Schema(
  {
    slug: { type: String, unique: true, index: true },
    title: { type: String, required: true },
    category: { type: String, index: true },
    subcategory: { type: String },
    region: { type: String, index: true },
    tags: [{ type: String }],
    prerequisites: [{ type: String }],
    isUnique: { type: Boolean, default: true },
    weight: { type: Number, default: 1 },
    mapRef: {
      lat: Number,
      lng: Number,
      note: String
    },
    notes: String
  },
  { timestamps: true }
);

export type ChecklistItem = typeof ChecklistItemModel extends infer M
  ? M extends { schema: unknown }
    ? InstanceType<typeof ChecklistItemModel>
    : never
  : never;

export const ChecklistItemModel = model('ChecklistItem', ChecklistItemSchema);
export default ChecklistItemModel;
