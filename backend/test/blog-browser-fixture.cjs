// Disposable local browser-QA data. Remove with: node test/blog-browser-fixture.cjs cleanup <run-id>
const mongoose = require('mongoose');
const { ConfigModule } = require('@nestjs/config');
const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');
const { BlogsSchema } = require('../dist/schemas/blogs.schema');
const { BlogCategorySchema } = require('../dist/schemas/blog-category.schema');
const { UserSchema } = require('../dist/schemas/user.schema');
const { GroupSchema } = require('../dist/schemas/groups.schema');

(async () => {
  await ConfigModule.forRoot();
  const connection = await mongoose.createConnection(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 }).asPromise();
  try {
    const User = connection.model('User', UserSchema);
    const Group = connection.model('Group', GroupSchema);
    const Blog = connection.model('Blogs', BlogsSchema);
    const Category = connection.model('BlogCategory', BlogCategorySchema);
    if (process.argv[2] === 'cleanup') {
      const run = process.argv[3];
      if (!/^blog-qa-[a-f0-9-]{36}$/.test(run ?? '')) throw new Error('Invalid test run identifier');
      const user = await User.findOne({ login: run });
      if (user) {
        await Blog.deleteMany({ createdBy: user._id });
        await connection.collection('auth_sessions').deleteMany({ userId: user._id });
        await User.deleteOne({ _id: user._id, login: run });
      }
      await Category.deleteMany({ slug: { $regex: `^${run}` } });
      await Group.deleteOne({ name: run });
      console.log(JSON.stringify({ cleaned: run }));
      return;
    }
    const run = `blog-qa-${randomUUID()}`;
    const company = await connection.collection('companies').findOne({});
    if (!company) throw new Error('Create a Company before browser QA.');
    const group = await Group.create({ name: run, companyIds: [company._id], menuItemIds: ['blogs'], modelAccess: [{ model: 'blogs', read: true, create: true, write: true, delete: true }] });
    const password = randomUUID();
    const user = await User.create({ login: run, name: 'Blog QA', email: `${run}@example.invalid`, password: await bcrypt.hash(password, 10), companyIds: [company._id], groupIds: [group._id] });
    const category = await Category.create({ name: 'QA Technology', slug: run });
    const sharp = require('../../frontend/node_modules/sharp');
    const image = await sharp({ create: { width: 800, height: 450, channels: 3, background: '#2563eb' } }).png().toBuffer();
    const blog = await Blog.create({ title: 'Blog foundation preview', subtitle: 'A separate subtitle', slug: run, categoryId: category._id, contentHtml: '<h2>Article body</h2><p>A published article with searchable architecture content.</p>', published: true, publishedAt: new Date(), createdBy: user._id, metaTitle: 'Blog QA SEO title', metaDescription: 'A test article for the Blog foundation.', metaKeywords: ['architecture'], coverImage: image, coverImageMimeType: 'image/png', hasCoverImage: true });
    await Blog.create({ title: 'QA Draft', slug: `${run}-draft`, createdBy: user._id, published: false });
    console.log(JSON.stringify({ run, login: run, password, blogId: String(blog._id), slug: blog.slug, categoryId: String(category._id) }));
  } finally { await connection.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
