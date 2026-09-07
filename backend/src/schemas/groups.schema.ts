import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import {
  MENU_ITEM_IDS,
  MODEL_ACCESS_KEYS,
} from '../access/access.constants';
import type {
  MenuItemId,
  ModelAccessKey,
} from '../access/access.constants';

export type GroupDocument = HydratedDocument<Group>;

@Schema({ _id: false })
export class ModelAccess {
  @Prop({ type: String, required: true, enum: MODEL_ACCESS_KEYS, trim: true })
  model!: ModelAccessKey;

  @Prop({ type: Boolean, default: false })
  read!: boolean;

  @Prop({ type: Boolean, default: false })
  create!: boolean;

  @Prop({ type: Boolean, default: false })
  write!: boolean;

  @Prop({ type: Boolean, default: false })
  delete!: boolean;
}

export const ModelAccessSchema = SchemaFactory.createForClass(ModelAccess);

@Schema({ timestamps: true, collection: 'groups' })
export class Group {
  @Prop({ required: true, trim: true, maxlength: 120 })
  name!: string;

  @Prop({ trim: true, maxlength: 500 })
  description?: string;

  @Prop({ type: Boolean, default: true, index: true })
  active!: boolean;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Company' }],
    default: [],
    validate: {
      validator: (values: Types.ObjectId[]) => values.length > 0,
      message: 'Select at least one Company.',
    },
  })
  companyIds!: Types.ObjectId[];

  @Prop({
    type: [{ type: String, enum: MENU_ITEM_IDS }],
    default: [],
    set: (values: string[] = []) => Array.from(new Set(values)),
  })
  menuItemIds!: MenuItemId[];

  @Prop({
    type: [ModelAccessSchema],
    default: [],
    validate: {
      validator: (values: ModelAccess[]) =>
        new Set(values.map((value) => value.model)).size === values.length,
      message: 'Each model can appear only once in model access.',
    },
  })
  modelAccess!: ModelAccess[];
}

export const GroupSchema = SchemaFactory.createForClass(Group);
GroupSchema.index({ name: 1 }, { unique: true });
