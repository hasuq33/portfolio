import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'crm_stages' })
export class CrmStage {
  @Prop({ required: true, trim: true, maxlength: 100 }) name!: string;
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId!: Types.ObjectId;
  @Prop({ default: 10, min: 0 }) sequence!: number;
  @Prop({ default: true }) active!: boolean;
  @Prop({ default: false }) fold!: boolean;
  @Prop({ min: 0, max: 100 }) probability?: number;
  // Stable seed identity; names and ordering remain editable.
  @Prop({ type: String, select: false }) seedKey?: string;
}
export const CrmStageSchema = SchemaFactory.createForClass(CrmStage);
CrmStageSchema.index({ companyId: 1, active: 1, sequence: 1 });
CrmStageSchema.index(
  { companyId: 1, seedKey: 1 },
  { unique: true, partialFilterExpression: { seedKey: { $type: 'string' } } },
);
