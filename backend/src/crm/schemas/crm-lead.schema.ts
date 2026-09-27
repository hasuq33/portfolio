import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';

export enum CrmType {
  Lead = 'lead',
  Opportunity = 'opportunity',
}
export enum CrmStatus {
  Open = 'open',
  Won = 'won',
  Lost = 'lost',
}
export enum CrmPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

@Schema({ timestamps: true, collection: 'crm_leads' })
export class CrmLead {
  @Prop({ required: true, trim: true, maxlength: 200 }) name!: string;
  @Prop({ enum: CrmType, default: CrmType.Lead }) type!: CrmType;
  @Prop({ enum: CrmStatus, default: CrmStatus.Open }) status!: CrmStatus;
  @Prop({ enum: CrmPriority, default: CrmPriority.Medium })
  priority!: CrmPriority;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Company', required: true })
  companyId!: Types.ObjectId;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' }) userId?: Types.ObjectId;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'CrmStage' }) stageId?: Types.ObjectId;
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'CrmTag' }], default: [] })
  tagIds!: Types.ObjectId[];
  @Prop({ trim: true, maxlength: 500 }) contactName?: string;
  @Prop({ trim: true, maxlength: 500 }) email?: string;
  @Prop({ trim: true, maxlength: 500 }) phone?: string;
  @Prop({ trim: true, maxlength: 500 }) mobile?: string;
  @Prop({ trim: true, maxlength: 500 }) companyName?: string;
  @Prop({ trim: true, maxlength: 500 }) jobPosition?: string;
  @Prop({ trim: true, maxlength: 500 }) website?: string;
  @Prop({ trim: true, maxlength: 500 }) street?: string;
  @Prop({ trim: true, maxlength: 500 }) street2?: string;
  @Prop({ trim: true, maxlength: 500 }) city?: string;
  @Prop({ trim: true, maxlength: 500 }) state?: string;
  @Prop({ trim: true, maxlength: 500 }) zip?: string;
  @Prop({ trim: true, maxlength: 500 }) country?: string;
  @Prop({ trim: true, maxlength: 500 }) source?: string;
  @Prop({ maxlength: 20000 }) description?: string;
  @Prop({ default: 0, min: 0 }) expectedRevenue!: number;
  @Prop({ default: 0, min: 0, max: 100 }) probability!: number;
  @Prop({ maxlength: 2000 }) lostReason?: string;
  @Prop({ type: Date }) dateDeadline?: Date;
  @Prop({ type: Date }) dateClosed?: Date;
  @Prop({ type: Date }) convertedAt?: Date;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' }) convertedBy?: Types.ObjectId;
}
export const CrmLeadSchema = SchemaFactory.createForClass(CrmLead);
CrmLeadSchema.index({ companyId: 1, type: 1, status: 1, createdAt: -1 });
CrmLeadSchema.index({ companyId: 1, userId: 1 });
CrmLeadSchema.index({ companyId: 1, stageId: 1 });
