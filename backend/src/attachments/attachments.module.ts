import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from '../auth/auth.module';
import { AccessModule } from '../access/access.module';

import {
  Blogs,
  BlogsSchema,
} from '../schemas/blogs.schema';

import {
  Attachment,
  AttachmentSchema,
} from './attachments.schema';

import { AttachmentsService } from './attachments.service';

import {
  AttachmentsController,
  PublicAttachmentsController,
} from './attachments.controller';

@Module({
  imports: [
    AuthModule,
    AccessModule,

    MongooseModule.forFeature([
      {
        name: Attachment.name,
        schema: AttachmentSchema,
      },
      {
        name: Blogs.name,
        schema: BlogsSchema,
      },
    ]),
  ],

  providers: [
    AttachmentsService,
  ],

  controllers: [
    AttachmentsController,
    PublicAttachmentsController,
  ],
})
export class AttachmentsModule {}