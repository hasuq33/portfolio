import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { AccessModule } from '../access/access.module';
import { Blogs, BlogsSchema } from '../schemas/blogs.schema';
import { BlogCategory, BlogCategorySchema } from '../schemas/blog-category.schema';
import { BlogsService } from './blogs.service';
import { BlogsController, PublicBlogsController } from './blogs.controller';

@Module({
  imports: [AuthModule, AccessModule, MongooseModule.forFeature([
    { name: Blogs.name, schema: BlogsSchema },
    { name: BlogCategory.name, schema: BlogCategorySchema },
  ])],
  providers: [BlogsService],
  controllers: [BlogsController, PublicBlogsController],
  exports: [BlogsService],
})
export class BlogsModule {}
