import { model, Schema, Types, type InferSchemaType } from 'mongoose';

const contactSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['personal', 'professional'],
      default: 'personal',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

export type ContactType = InferSchemaType<typeof contactSchema>;
export type ContactDocument = ContactType & { _id: Types.ObjectId };

export const Contact = model<ContactType>('Contact', contactSchema);
