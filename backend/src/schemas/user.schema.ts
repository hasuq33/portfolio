import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, select: false })
  password?: string;

  @Prop({ unique: true, required: true, trim: true })
  login?: string;

  @Prop({ type: Types.ObjectId, ref: 'Partner' })
  partnerId?: Types.ObjectId;

  @Prop()
  name?: string;

  @Prop({ type: Buffer, select: false })
  avatar_image?: Buffer;

  @Prop({ type: String, select: false })
  avatar_image_mime_type?: string;

  @Prop({ default: false })
  hasAvatar?: boolean;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email?: string;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Company' }],
    default: [],
  })
  companyIds!: Types.ObjectId[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
    default: [],
  })
  groupIds!: Types.ObjectId[];

  @Prop({ type: Boolean, default: false })
  allowedToAllCompanies!: boolean;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  zip?: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ trim: true })
  address2?: string;

  @Prop({ trim: true })
  city?: string;

  @Prop({ trim: true })
  state?: string;

  @Prop({ trim: true })
  country?: string;

  @Prop({ type: String, enum: ['active', 'inactive'], default: 'active' })
  status?: 'active' | 'inactive';

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop({ default: false })
  isVerified?: boolean;

  @Prop()
  website?: string;

  @Prop({ trim: true })
  jobTitle?: string;

  @Prop({ trim: true })
  department?: string;

  @Prop({ trim: true })
  language?: string;

  @Prop({ trim: true })
  timezone?: string;

  @Prop({ type: Date })
  joinedAt?: Date;

  @Prop({ select: false, default: 0 })
  authVersion?: number;

  @Prop({ select: false, index: true })
  passwordResetTokenHash?: string;

  @Prop({ type: Date, select: false })
  passwordResetExpiresAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
