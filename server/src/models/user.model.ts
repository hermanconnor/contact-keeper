import { model, Schema, Types, type InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    refreshTokenHash: {
      type: String,
      select: false,
    },
  },
  { timestamps: true },
);

export type UserType = InferSchemaType<typeof userSchema>;
export type AuthenticatedUser = Pick<
  UserType,
  'name' | 'email' | 'createdAt' | 'updatedAt'
> & { _id: Types.ObjectId };

export const User = model<UserType>('User', userSchema);
