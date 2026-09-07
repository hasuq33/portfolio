import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CompanyDocument = HydratedDocument<Company>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WEBSITE_PATTERN = /^https?:\/\/[^\s]+$/i;

@Schema({ timestamps: true, collection: 'companies' })
export class Company {
  @Prop({ required: true, trim: true, maxlength: 160 })
  name!: string;

  @Prop({
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 30,
    match: /^[A-Z][A-Z0-9_]*$/,
  })
  code!: string;

  @Prop({
    trim: true,
    lowercase: true,
    validate: {
      validator: (value?: string) => !value || EMAIL_PATTERN.test(value),
      message: 'Email must be a valid email address.',
    },
  })
  email?: string;

  @Prop({ trim: true, maxlength: 50 })
  phone?: string;

  @Prop({
    trim: true,
    validate: {
      validator: (value?: string) => !value || WEBSITE_PATTERN.test(value),
      message: 'Website must be a valid HTTP or HTTPS URL.',
    },
  })
  website?: string;

  @Prop({ trim: true, maxlength: 240 })
  street?: string;

  @Prop({ trim: true, maxlength: 240 })
  street2?: string;

  @Prop({ trim: true, maxlength: 120 })
  city?: string;

  @Prop({ trim: true, maxlength: 120 })
  state?: string;

  @Prop({ trim: true, maxlength: 30 })
  zip?: string;

  @Prop({ trim: true, maxlength: 120 })
  country?: string;

  @Prop({ default: true, index: true })
  active!: boolean;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
CompanySchema.index({ code: 1 }, { unique: true });
