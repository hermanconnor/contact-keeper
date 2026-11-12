import {
  model,
  Schema,
  type HydratedDocument,
  type InferSchemaType,
  type Types,
} from 'mongoose';

const refreshTokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },

    familyId: {
      type: String,
      required: [true, 'Family ID is required'],
      trim: true,
      index: true,
    },

    tokenHash: {
      type: String,
      required: [true, 'Token hash is required'],
      unique: true,
      trim: true,
    },

    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    replacedBy: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true },
);

// TTL index to automatically delete expired tokens from MongoDB
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RefreshTokenType = InferSchemaType<typeof refreshTokenSchema>;
export type TokenDoc = HydratedDocument<RefreshTokenType>;

/** Shape returned by `.lean()`: a plain object, not a hydrated document. */
export type TokenLean = RefreshTokenType & { _id: Types.ObjectId };

export const RefreshToken = model<RefreshTokenType>(
  'RefreshToken',
  refreshTokenSchema,
);
