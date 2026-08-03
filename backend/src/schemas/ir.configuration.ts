import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type IrConfigurationDocument =
  HydratedDocument<IrConfiguration>;

@Schema({
  timestamps: true,
  collection: 'ir.configuration',
})
export class IrConfiguration {

  @Prop({
    required: [true, 'Company name is required.'],
    trim: true,
    default: 'My Application',
  })
  companyName!: string;

  @Prop({
    required: false,
    trim: true,
    default: '',
  })
  companyWebsite!: string;

  @Prop({
    required: false,
    trim: true,
    default:''
  })
  mainEmail!: string;

  @Prop({
    required: false,
    default: '',
  })
  faviconUrl!: string;

  @Prop({
    required: false,
    default: '',
  })
  companyLogoUrl!: string;

  @Prop({
    required: false,
    default: '',
    select: false,
  })
  openAiApiKey!: string;

  @Prop({
    required: false,
    default: '',
    select: false,
  })
  geminiApiKey!: string;

  @Prop({
    required: false,
    enum: ['openai', 'gemini'],
    default: 'openai',
  })
  defaultAiProvider!: string;

  @Prop({
    required: true,
    default: false,
  })
  compactMode!: boolean;

  @Prop({
    required: true,
    default: true,
  })
  isActive!: boolean;
}

export const IRConfigSchema = SchemaFactory.createForClass(IrConfiguration);
