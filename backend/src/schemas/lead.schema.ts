import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LeadDocument = HydratedDocument<Lead>;

@Schema({ timestamps: true, collection: 'lead' })
export class Lead {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  email?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  companyName?: string;

  @Prop({
    type: String,
    enum: ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'],
    default: 'New',
  })
  status!: string;

  @Prop({
    type: String,
    enum: [
      'Website',
      'Referral',
      'Cold Call',
      'Campaign',
      'Social Media',
      'Other',
    ],
    default: 'Other',
  })
  source!: string;

  @Prop({ type: Number, default: 0 })
  estimatedValue?: number;

  @Prop({ type: Date })
  followUpDate?: Date;

  @Prop({ type: String })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'user' })
  assignedTo?: Types.ObjectId;
}

export const LeadSchema = SchemaFactory.createForClass(Lead);
