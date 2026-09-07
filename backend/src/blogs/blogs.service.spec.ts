import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { BlogsService, validateBlogImage } from './blogs.service';
import { sanitizeBlogHtml, blogExcerpt } from './blog-html';
import { slugify } from './slug';

const duplicate = Object.assign(new Error('Duplicate'), { code: 11000 });
const query = (value: unknown) => {
  const result = { select: jest.fn(), populate: jest.fn(), sort: jest.fn(), skip: jest.fn(), limit: jest.fn(), lean: jest.fn(), then: (resolve: (value: unknown) => unknown) => Promise.resolve(value).then(resolve) };
  for (const name of ['select', 'populate', 'sort', 'skip', 'limit', 'lean'] as const) result[name].mockReturnValue(result);
  return result;
};
describe('Blog foundation', () => {
  const blogs = { create: jest.fn(), findById: jest.fn(), exists: jest.fn(), find: jest.fn(), findOne: jest.fn(), countDocuments: jest.fn(), findByIdAndUpdate: jest.fn() };
  const categories = { create: jest.fn(), exists: jest.fn(), findOne: jest.fn() };
  const service = new BlogsService(blogs as never, categories as never);
  beforeEach(() => jest.resetAllMocks());

  it('normalizes titles and creates without a category, keeping subtitle separate', async () => {
    expect(slugify(' Café & ERP — Access! ')).toBe('cafe-erp-access');
    blogs.create.mockImplementation(async value => value);
    const blog = await service.create('Blogs', { title: 'Modern ERP', subtitle: 'A separate subtitle', contentHtml: '<p>Hello</p>' });
    expect(blog).toMatchObject({ title: 'Modern ERP', subtitle: 'A separate subtitle', slug: 'modern-erp', contentHtml: '<p>Hello</p>' });
    expect(blog).not.toHaveProperty('publishedAt');
    expect(categories.exists).not.toHaveBeenCalled();
  });
  it('adds suffixes for automatic collisions, including concurrent unique-index conflicts', async () => {
    blogs.create.mockRejectedValueOnce(duplicate).mockRejectedValueOnce(duplicate).mockImplementation(async value => value);
    await expect(service.create('Blogs', { title: 'ERP', autoSlug: true, slug: 'erp' })).resolves.toHaveProperty('slug', 'erp-3');
  });
  it('rejects a duplicate manually entered slug without changing it', async () => {
    blogs.create.mockRejectedValue(duplicate);
    await expect(service.create('Blogs', { title: 'ERP', slug: 'custom-link', autoSlug: false })).rejects.toBeInstanceOf(ConflictException);
    expect(blogs.create).toHaveBeenCalledTimes(1);
  });
  it('does not regenerate a manually cleared URL', async () => {
    await expect(service.create('Blogs', { title: 'ERP', slug: '', autoSlug: false })).rejects.toBeInstanceOf(BadRequestException);
    expect(blogs.create).not.toHaveBeenCalled();
  });
  it('validates optional references and boolean/SEO types', async () => {
    categories.exists.mockResolvedValue(null);
    await expect(service.create('Blogs', { title: 'ERP', categoryId: String(new Types.ObjectId()) })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.create('Blogs', { title: 'ERP', published: 'true' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.create('Blogs', { title: 'ERP', contentHtml: null })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.create('Blogs', { title: 'ERP', publishedAt: new Date() })).rejects.toBeInstanceOf(BadRequestException);
    categories.exists.mockResolvedValue({ _id: 'category' });
    blogs.create.mockImplementation(async value => value);
    await expect(service.create('Blogs', { title: 'ERP', categoryId: String(new Types.ObjectId()), metaKeywords: ['ERP'], metaTitle: 'Search title', published: true })).resolves.toMatchObject({ metaTitle: 'Search title', metaKeywords: ['ERP'], publishedAt: expect.any(Date) });
  });
  it('keeps existing slug and first publish date across edits and republishing', async () => {
    const publishedAt = new Date('2026-01-01');
    const record = { get: jest.fn(() => publishedAt), set: jest.fn(), save: jest.fn().mockResolvedValue({}) };
    blogs.findById.mockResolvedValue(record);
    await service.update('Blogs', 'id', { title: 'Renamed', published: true });
    expect(record.set).toHaveBeenCalledWith({ title: 'Renamed', published: true });
    await service.update('Blogs', 'id', { slug: 'New URL' });
    expect(record.set).toHaveBeenLastCalledWith({ slug: 'new-url' });
  });
  it('sets first publication time only when needed', async () => {
    const record = { get: jest.fn(() => undefined), set: jest.fn(), save: jest.fn().mockResolvedValue({}) };
    blogs.findById.mockResolvedValue(record);
    await service.update('Blogs', 'id', { published: true });
    expect(record.set).toHaveBeenCalledWith({ published: true, publishedAt: expect.any(Date) });
  });
  it('sanitizes unsafe HTML and preserves article formatting', () => {
    const html = sanitizeBlogHtml('<h1>Heading</h1><script>alert(1)</script><p onclick="evil()">Safe <a href="javascript:evil()">link</a></p><img src="x" onerror="evil()"><iframe src="https://evil.test"></iframe>');
    expect(html).toContain('<h2>Heading</h2>');
    expect(html).not.toMatch(/<script|onclick|onerror|javascript:|iframe/);
    expect(blogExcerpt('<p>Readable &amp; useful</p>')).toBe('Readable & useful');
  });
  it('serves only published search/detail/images and excludes body HTML from cards', async () => {
    blogs.find.mockReturnValue(query([{ title: 'ERP', contentHtml: '<p>Article excerpt</p>' }]));
    blogs.countDocuments.mockResolvedValue(1);
    const result = await service.publicSearch('ERP.*');
    expect(blogs.find).toHaveBeenCalledWith(expect.objectContaining({ published: true, $or: expect.arrayContaining([{ title: { $regex: 'ERP\\.\\*', $options: 'i' } }]) }));
    expect(result.records[0]).toMatchObject({ excerpt: 'Article excerpt' });
    expect(result.records[0]).not.toHaveProperty('contentHtml');
    blogs.findOne.mockReturnValue(query(null));
    await expect(service.publicDetail('draft')).rejects.toBeInstanceOf(NotFoundException);
    expect(blogs.findOne).toHaveBeenLastCalledWith({ slug: 'draft', published: true });
    const id = String(new Types.ObjectId());
    await expect(service.image(id, 'cover', true)).rejects.toBeInstanceOf(NotFoundException);
    expect(blogs.findOne).toHaveBeenLastCalledWith({ _id: id, published: true });
  });
  it('uploads/removes independent cover and OG binaries and rejects disguised scripts', async () => {
    const file = { buffer: Buffer.from([255, 216, 255, 0]), mimetype: 'image/jpeg', size: 4 };
    blogs.findByIdAndUpdate.mockResolvedValue({});
    await service.setImage('id', 'cover', file);
    expect(blogs.findByIdAndUpdate).toHaveBeenLastCalledWith('id', { $set: { coverImage: file.buffer, coverImageMimeType: 'image/jpeg', hasCoverImage: true } }, expect.anything());
    await service.setImage('id', 'og-image', file);
    expect(blogs.findByIdAndUpdate).toHaveBeenLastCalledWith('id', { $set: { ogImage: file.buffer, ogImageMimeType: 'image/jpeg', hasOgImage: true } }, expect.anything());
    await service.setImage('id', 'cover');
    expect(blogs.findByIdAndUpdate).toHaveBeenLastCalledWith('id', { $unset: { coverImage: 1, coverImageMimeType: 1 }, $set: { hasCoverImage: false } }, expect.anything());
    await service.setImage('id', 'og-image');
    expect(blogs.findByIdAndUpdate).toHaveBeenLastCalledWith('id', { $unset: { ogImage: 1, ogImageMimeType: 1 }, $set: { hasOgImage: false } }, expect.anything());
    expect(() => validateBlogImage({ buffer: Buffer.from('<script>'), mimetype: 'image/jpeg', size: 8 })).toThrow(BadRequestException);
  });
});
