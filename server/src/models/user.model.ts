import { model, Schema, Types, type InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [70, 'Name must be fewer than 70 characters long'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      maxlength: [254, 'Email is too long'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
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
