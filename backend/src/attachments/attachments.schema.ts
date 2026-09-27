import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongoSchema, Types } from 'mongoose';

import { User } from '../schemas/user.schema';

@Schema({
  timestamps: true,
  collection: 'attachments',
})
export class Attachment {
  @Prop({
    required: true,
    maxlength: 200,
  })
  name!: string;

  @Prop({
    required: true,
  })
  mimeType!: string;

  @Prop({
    required: true,
  })
  size!: number;

  @Prop({
    required: true,
  })
  width!: number;

  @Prop({
    required: true,
  })
  height!: number;

  @Prop({
    type: Buffer,
    required: true,
    select: false,
  })
  data!: Buffer;

  @Prop({
    type: MongoSchema.Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  createdBy!: Types.ObjectId;
}

export const AttachmentSchema =
  SchemaFactory.createForClass(Attachment);