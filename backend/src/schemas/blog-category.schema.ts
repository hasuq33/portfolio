import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, collection: 'blogcategories' })
export class BlogCategory {
  @Prop({ required: true, trim: true, maxlength: 120 }) name!: string;
  @Prop({ required: true, trim: true, maxlength: 160, match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ }) slug!: string;
  @Prop({ trim: true, maxlength: 500 }) description?: string;
  @Prop({ default: true }) active!: boolean;
}
export const BlogCategorySchema = SchemaFactory.createForClass(BlogCategory);
BlogCategorySchema.index({ slug: 1 }, { unique: true });
