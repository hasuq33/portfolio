import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Blogs } from '../schemas/blogs.schema';
import { BlogCategory } from '../schemas/blog-category.schema';
import { CreateBlogDto, CreateBlogCategoryDto, UpdateBlogDto, UpdateBlogCategoryDto, validateBlogDto } from './blog.dto';
import { slugify } from './slug';
import { blogExcerpt, sanitizeBlogHtml } from './blog-html';

export interface ImageUpload { buffer: Buffer; mimetype: string; size: number }
const publicFields = 'title subtitle slug categoryId contentHtml metaTitle metaDescription metaKeywords publishedAt updatedAt hasCoverImage hasOgImage';

@Injectable()
export class BlogsService {
  constructor(
    @InjectModel(Blogs.name) private readonly blogs: Model<Blogs>,
    @InjectModel(BlogCategory.name) private readonly categories: Model<BlogCategory>,
  ) {}
  private fieldError(field: string, message: string) {
    return new BadRequestException({ statusCode: 400, message, errors: [{ field, message }] });
  }
  private duplicateSlug(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
  }
  private urlConflict() {
    return new ConflictException({ statusCode: 409, message: 'This URL is already in use.', errors: [{ field: 'slug', message: 'This URL is already in use.' }] });
  }
  private normalizeSlug(value: string) {
    const normalized = slugify(value);
    if (!normalized) throw this.fieldError('slug', 'Enter a URL segment containing letters or numbers.');
    return normalized;
  }
  private async checkCategory(categoryId?: string | null) {
    if (categoryId && !await this.categories.exists({ _id: categoryId })) throw this.fieldError('categoryId', 'Select an existing category.');
  }
  async create(modelName: string, data: unknown, userId?: string) {
    const category = modelName === 'BlogCategory';
    const dto = category ? await validateBlogDto(CreateBlogCategoryDto, data) : await validateBlogDto(CreateBlogDto, data);
    const { autoSlug, slug, ...values } = dto;
    const automatic = autoSlug === true || (autoSlug !== false && (slug === undefined || slug === ''));
    if (!automatic && !slug?.trim()) throw this.fieldError('slug', 'Enter a URL segment containing letters or numbers.');
    const base = this.normalizeSlug(automatic ? ('title' in dto ? dto.title : dto.name) : slug!);
    if (!category) await this.checkCategory((dto as CreateBlogDto).categoryId);
    const model = (category ? this.categories : this.blogs) as unknown as Model<Record<string, unknown>>;
    const payload: Record<string, unknown> = { ...values };
    if (!category) {
      payload.contentHtml = sanitizeBlogHtml((dto as CreateBlogDto).contentHtml ?? '');
      if (userId) payload.createdBy = new Types.ObjectId(userId);
      if ((dto as CreateBlogDto).published) payload.publishedAt = new Date();
    }
    // The unique index handles races between concurrent authors.
    for (let suffix = 1; suffix <= 1000; suffix++) {
      const candidate = suffix === 1 ? base : `${base}-${suffix}`;
      try { return await model.create({ ...payload, slug: candidate }); } catch (error) {
        if (!this.duplicateSlug(error)) throw error;
        if (!automatic) throw this.urlConflict();
      }
    }
    throw this.fieldError('slug', 'Choose a more specific URL segment.');
  }
  async update(modelName: string, id: string, data: unknown) {
    const category = modelName === 'BlogCategory';
    const dto = category ? await validateBlogDto(UpdateBlogCategoryDto, data, true) : await validateBlogDto(UpdateBlogDto, data, true);
    const { autoSlug: _autoSlug, slug, ...values } = dto;
    const model = (category ? this.categories : this.blogs) as unknown as Model<Record<string, unknown>>;
    const record = await model.findById(id);
    if (!record) throw new NotFoundException('Record not found.');
    const payload: Record<string, unknown> = { ...values };
    if (slug !== undefined) payload.slug = this.normalizeSlug(slug);
    if (!category) {
      const blog = dto as UpdateBlogDto;
      await this.checkCategory(blog.categoryId);
      if (blog.contentHtml !== undefined) payload.contentHtml = sanitizeBlogHtml(blog.contentHtml);
      if (blog.published && !record.get('publishedAt')) payload.publishedAt = new Date();
    }
    record.set(payload);
    try { return await record.save(); } catch (error) {
      if (this.duplicateSlug(error)) throw this.urlConflict();
      throw error;
    }
  }
  async slugAvailability(slug: string, excludeId?: string) {
    const normalized = slugify(slug);
    const filter: Record<string, unknown> = { slug: normalized };
    if (excludeId && Types.ObjectId.isValid(excludeId)) filter._id = { $ne: excludeId };
    return { slug: normalized, available: Boolean(normalized) && !await this.blogs.exists(filter) };
  }
  async publicCategories() {
    return this.categories.find({ active: true }).select('name slug').sort({ name: 1 }).lean();
  }
  async publicSearch(search = '', category = '', page = 1) {
    const filter: Record<string, unknown> = { published: true };
    if (category) {
      const record = await this.categories.findOne({ slug: category, active: true }).select('_id').lean();
      if (!record) return { records: [], total: 0, page: 1, limit: 12 };
      filter.categoryId = record._id;
    }
    if (search.trim()) {
      const regex = search.slice(0, 200).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = ['title', 'subtitle', 'contentHtml', 'metaTitle', 'metaDescription', 'metaKeywords'].map(field => ({ [field]: { $regex: regex, $options: 'i' } }));
    }
    const safePage = Math.min(10000, Math.max(1, Math.floor(Number(page)) || 1));
    const [records, total] = await Promise.all([
      this.blogs.find(filter).select(publicFields).populate('categoryId', 'name slug active').sort({ publishedAt: -1, _id: -1 }).skip((safePage - 1) * 12).limit(12).lean(),
      this.blogs.countDocuments(filter),
    ]);
    return { records: records.map(({ contentHtml, ...record }) => ({ ...record, excerpt: record.metaDescription || blogExcerpt(contentHtml) })), total, page: safePage, limit: 12 };
  }
  async publicDetail(slug: string) {
    const record = await this.blogs.findOne({ slug, published: true }).select(publicFields).populate('categoryId', 'name slug active').lean();
    if (!record) throw new NotFoundException('Blog not found.');
    return { ...record, contentHtml: sanitizeBlogHtml(record.contentHtml), excerpt: record.metaDescription || blogExcerpt(record.contentHtml) };
  }
  private imageFields(kind: string) {
    if (kind === 'cover') return { data: 'coverImage', mime: 'coverImageMimeType', present: 'hasCoverImage' } as const;
    if (kind === 'og-image') return { data: 'ogImage', mime: 'ogImageMimeType', present: 'hasOgImage' } as const;
    throw new NotFoundException('Image not found.');
  }
  async image(id: string, kind: string, publicOnly = false) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Image not found.');
    const fields = this.imageFields(kind);
    const blog = await this.blogs.findOne({ _id: id, ...(publicOnly ? { published: true } : {}) }).select(`+${fields.data} +${fields.mime}`);
    const buffer = blog?.get(fields.data) as Buffer | undefined;
    if (!buffer) throw new NotFoundException('Image not found.');
    return { buffer, mimeType: blog!.get(fields.mime) as string };
  }
  async setImage(id: string, kind: string, file?: ImageUpload) {
    const fields = this.imageFields(kind);
    if (file) validateBlogImage(file);
    const update = file
      ? { $set: { [fields.data]: file.buffer, [fields.mime]: file.mimetype, [fields.present]: true } }
      : { $unset: { [fields.data]: 1, [fields.mime]: 1 }, $set: { [fields.present]: false } };
    const blog = await this.blogs.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!blog) throw new NotFoundException('Blog not found.');
    return blog;
  }
}

export function validateBlogImage(file: ImageUpload) {
  const b = file.buffer;
  const valid = (file.mimetype === 'image/jpeg' && b.length >= 3 && b[0] === 255 && b[1] === 216 && b[2] === 255)
    || (file.mimetype === 'image/png' && b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])))
    || (file.mimetype === 'image/gif' && ['GIF87a', 'GIF89a'].includes(b.subarray(0, 6).toString('ascii')))
    || (file.mimetype === 'image/webp' && b.length >= 12 && b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP');
  if (!valid || file.size > 2 * 1024 * 1024 || b.length > 2 * 1024 * 1024) throw new BadRequestException('Select a valid JPEG, PNG, WebP or GIF image, maximum 2 MB.');
}
