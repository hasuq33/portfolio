import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'crm_tags' })
export class CrmTag {
  @Prop({ required: true, trim: true, maxlength: 100 }) name!: string;
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId!: Types.ObjectId;
  @Prop({ match: /^#[0-9a-fA-F]{6}$/ }) color?: string;
}
export const CrmTagSchema = SchemaFactory.createForClass(CrmTag);
CrmTagSchema.index({ companyId: 1, name: 1 }, { unique: true });
