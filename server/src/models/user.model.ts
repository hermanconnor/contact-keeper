import {
  model,
  Schema,
  type HydratedDocument,
  type InferSchemaType,
  type Types,
} from 'mongoose';

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name must be fewer than 100 characters long'],
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
  },
  { timestamps: true },
);

export type UserType = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<UserType>;

/** Shape returned by `.lean()`: a plain object, not a hydrated document. */
export type UserLean = UserType & { _id: Types.ObjectId };

export type PublicUserDto = Pick<
  UserDoc,
  '_id' | 'name' | 'email' | 'createdAt' | 'updatedAt'
>;

export const User = model<UserType>('User', userSchema);
