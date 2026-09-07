import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type BlogsDocument = HydratedDocument<Blogs>;

@Schema({ timestamps: true, collection: 'blogs' })
export class Blogs {
  @Prop({ required: true, trim: true, maxlength: 200 }) title!: string;
  @Prop({ trim: true, maxlength: 400 }) subtitle?: string;
  @Prop({ required: true, trim: true, maxlength: 160, match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ }) slug!: string;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'BlogCategory', default: null }) categoryId?: Types.ObjectId | null;
  @Prop({ type: String, default: '', maxlength: 500000 }) contentHtml!: string;
  @Prop({ type: Buffer, select: false }) coverImage?: Buffer;
  @Prop({ select: false }) coverImageMimeType?: string;
  @Prop({ default: false }) hasCoverImage!: boolean;
  @Prop({ trim: true, maxlength: 200 }) metaTitle?: string;
  @Prop({ trim: true, maxlength: 500 }) metaDescription?: string;
  @Prop({ type: [String], default: [] }) metaKeywords!: string[];
  @Prop({ type: Buffer, select: false }) ogImage?: Buffer;
  @Prop({ select: false }) ogImageMimeType?: string;
  @Prop({ default: false }) hasOgImage!: boolean;
  @Prop({ default: false }) published!: boolean;
  @Prop({ type: Date }) publishedAt?: Date;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' }) createdBy?: Types.ObjectId;
}

export const BlogsSchema = SchemaFactory.createForClass(Blogs);
BlogsSchema.index({ slug: 1 }, { unique: true });
BlogsSchema.index({ published: 1, publishedAt: -1 });
