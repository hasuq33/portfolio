import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import mongoose, { Connection, Types } from 'mongoose';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { CommonController } from '../common/common.controller';
import { CommonService } from '../common/common.service';
import { BlogsController, PublicBlogsController } from './blogs.controller';
import { BlogsService } from './blogs.service';
import { BlogsSchema } from '../schemas/blogs.schema';
import { BlogCategorySchema } from '../schemas/blog-category.schema';
import { GroupSchema } from '../schemas/groups.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccessService } from '../access/access.service';
import { ModelAccessGuard } from '../access/model-access.guard';
import { MongooseExceptionFilter } from '../common/filters/mongoose-exception.filter';

// Explicit opt-in. Every run uses its own disposable database, never the application database.
const integration = process.env.BLOG_INTEGRATION === 'true' ? describe : describe.skip;
integration('Blog HTTP + MongoDB integration', () => {
  let app: INestApplication;
  let connection: Connection;
  let actor: { _id: Types.ObjectId; groupIds: Types.ObjectId[]; companyIds: Types.ObjectId[]; allowedToAllCompanies: boolean };
  const database = `portfolio_blog_test_${randomUUID().replace(/-/g, '')}`;
  beforeAll(async () => {
    connection = await mongoose.createConnection(process.env.BLOG_TEST_MONGODB_URI ?? 'mongodb://127.0.0.1:27017', { dbName: database, serverSelectionTimeoutMS: 5000 }).asPromise();
    const blogs = connection.model('Blogs', BlogsSchema);
    const categories = connection.model('BlogCategory', BlogCategorySchema);
    const groups = connection.model('Group', GroupSchema);
    await Promise.all([blogs.init(), categories.init(), groups.init()]);
    const companyId = new Types.ObjectId();
    const group = await groups.create({ name: 'Blog test editor', companyIds: [companyId], menuItemIds: ['blogs'], modelAccess: [{ model: 'blogs', read: true, create: true, write: true, delete: true }] });
    actor = { _id: new Types.ObjectId(), companyIds: [companyId], groupIds: [group._id], allowedToAllCompanies: false };
    const module = await Test.createTestingModule({
      controllers: [CommonController, BlogsController, PublicBlogsController],
      providers: [CommonService, ModelAccessGuard,
        { provide: getConnectionToken(), useValue: connection },
        { provide: BlogsService, useValue: new BlogsService(blogs, categories) },
        { provide: AccessService, useValue: new AccessService(groups) },
      ],
    }).overrideGuard(JwtAuthGuard).useValue({ canActivate: context => { context.switchToHttp().getRequest().user = actor; return true; } }).compile();
    app = module.createNestApplication();
    app.useGlobalFilters(new MongooseExceptionFilter());
    await app.init();
  }, 20000);
  afterAll(async () => {
    if (app) await app.close();
    if (connection) {
      if (connection.name === database && database.startsWith('portfolio_blog_test_')) await connection.dropDatabase();
      await connection.close();
    }
  });

  it('persists the complete authoring, publication, images, search and permission flow', async () => {
    const http = app.getHttpServer();
    const category = (await request(http).post('/api/BlogCategory').send({ name: 'ERP', slug: 'erp' }).expect(201)).body;
    const first = (await request(http).post('/api/Blogs').send({ title: 'An ERP Article', subtitle: 'Separate subtitle', contentHtml: '<h2>Useful</h2><p>Company architecture</p><script>evil()</script>', categoryId: category._id, metaTitle: 'SEO title', metaDescription: 'SEO description', metaKeywords: ['ERP'], published: false }).expect(201)).body;
    expect(first.createdBy).toBe(String(actor._id));
    expect(first.slug).toBe('an-erp-article');
    expect(first.contentHtml).not.toContain('script');
    const second = (await request(http).post('/api/Blogs').send({ title: 'An ERP Article', categoryId: null }).expect(201)).body;
    expect(second.slug).toBe('an-erp-article-2');
    await request(http).post('/api/Blogs').send({ title: 'Other', slug: first.slug, autoSlug: false }).expect(409);
    await request(http).get(`/public/blogs/${first.slug}`).expect(404);
    expect((await request(http).get('/public/blogs?search=ERP').expect(200)).body.total).toBe(0);
    const edited = (await request(http).put(`/api/Blogs/${first._id}`).send({ title: 'Renamed article', published: true }).expect(200)).body;
    expect(edited.slug).toBe(first.slug);
    expect(edited.subtitle).toBe('Separate subtitle');
    const firstPublishedAt = edited.publishedAt;
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
    for (const kind of ['cover', 'og-image']) {
      await request(http).put(`/blogs/${first._id}/images/${kind}`).attach('file', png, { filename: 'test.png', contentType: 'image/png' }).expect(200);
      await request(http).get(`/public/blogs/images/${first._id}/${kind}`).expect(200).expect('Content-Type', /image\/png/);
    }
    const detail = (await request(http).get(`/public/blogs/${first.slug}`).expect(200)).body;
    expect(detail).toMatchObject({ title: 'Renamed article', subtitle: 'Separate subtitle', metaTitle: 'SEO title', hasCoverImage: true, hasOgImage: true });
    expect(detail).not.toHaveProperty('coverImage');
    const listing = (await request(http).get('/public/blogs?search=architecture&category=erp').expect(200)).body;
    expect(listing.total).toBe(1);
    expect(listing.records[0].excerpt).toBe('SEO description');
    expect(listing.records[0]).not.toHaveProperty('contentHtml');
    const adminList = (await request(http).post('/api/Blogs/search').send({ fields: ['title', 'categoryId', 'published'], withCount: true, search: { query: 'Renamed', fields: ['title'] } }).expect(201)).body;
    expect(adminList.records[0].categoryId.name).toBe('ERP');
    await request(http).put(`/api/BlogCategory/${category._id}`).send({ active: false }).expect(200);
    await request(http).put(`/api/Blogs/${first._id}`).send({ categoryId: category._id }).expect(200);
    expect((await request(http).get('/public/blogs/categories')).body).toHaveLength(0);
    await request(http).put(`/api/Blogs/${first._id}`).send({ published: false }).expect(200);
    await request(http).get(`/public/blogs/images/${first._id}/cover`).expect(404);
    const republished = (await request(http).put(`/api/Blogs/${first._id}`).send({ published: true }).expect(200)).body;
    expect(republished.publishedAt).toBe(firstPublishedAt);
    for (const kind of ['cover', 'og-image']) {
      await request(http).delete(`/blogs/${first._id}/images/${kind}`).expect(200);
      await request(http).get(`/public/blogs/images/${first._id}/${kind}`).expect(404);
    }
    const memberships = actor.groupIds;
    actor.groupIds = [];
    await request(http).post('/api/Blogs/search').send({}).expect(403);
    await request(http).put(`/api/Blogs/${first._id}`).send({ title: 'Unauthorized edit' }).expect(403);
    await request(http).post('/api/Blogs').send({ title: 'Unauthorized create' }).expect(403);
    await request(http).delete(`/api/Blogs/${first._id}`).expect(403);
    actor.groupIds = memberships;
  }, 30000);
});
