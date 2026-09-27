import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import {
  HydratedDocument,
  Model,
  Types,
} from 'mongoose';

import sharp from 'sharp';

import { AccessService } from '../access/access.service';
import { User } from '../schemas/user.schema';
import { Blogs } from '../schemas/blogs.schema';
import { validateBlogImage } from '../blogs/blogs.service';

import { Attachment } from './attachments.schema';
import { UploadedImage } from './types/uploaded-image.type';

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectModel(Attachment.name)
    private readonly attachments: Model<Attachment>,

    @InjectModel(Blogs.name)
    private readonly blogs: Model<Blogs>,

    private readonly access: AccessService,
  ) {}

  async upload(
    user: HydratedDocument<User>,
    file?: UploadedImage,
  ) {
    const permissions = await this.access.getModelAccess(
      user,
      'blogs',
    );

    if (
      !permissions.read ||
      !(permissions.create || permissions.write)
    ) {
      throw new ForbiddenException(
        'You cannot upload blog images.',
      );
    }

    if (!file) {
      throw new BadRequestException('Choose an image.');
    }

    validateBlogImage(file);

    let output: {
      data: Buffer;
      info: {
        width: number;
        height: number;
      };
    };

    try {
      output = await sharp(file.buffer, {
        limitInputPixels: 25_000_000,
        animated: false,
        failOn: 'warning',
      })
        .rotate()
        .webp({
          quality: 85,
        })
        .toBuffer({
          resolveWithObject: true,
        });
    } catch {
      throw new BadRequestException(
        'The image could not be decoded.',
      );
    }

    if (output.data.length > MAX_IMAGE_BYTES) {
      throw new BadRequestException(
        'The processed image is too large. Choose a smaller image.',
      );
    }

    const attachment = await this.attachments.create({
      name: file.originalname.slice(0, 200),
      mimeType: 'image/webp',
      size: output.data.length,
      width: output.info.width,
      height: output.info.height,
      data: output.data,
      createdBy: user._id,
    });

    return {
      id: String(attachment._id),
      url: `/editor-media/${attachment._id}`,
      width: attachment.width,
      height: attachment.height,
    };
  }

  async image(
    id: string,
    publicOnly: boolean,
  ) {
    if (!/^[a-f\d]{24}$/i.test(id)) {
      throw new NotFoundException('Image not found.');
    }

    if (publicOnly) {
      const publishedReference = await this.blogs.exists({
        published: true,
        contentAttachmentIds: new Types.ObjectId(id),
      });

      if (!publishedReference) {
        throw new NotFoundException('Image not found.');
      }
    }

    const attachment = await this.attachments
      .findById(id)
      .select('+data');

    if (!attachment?.data) {
      throw new NotFoundException('Image not found.');
    }

    return attachment;
  }

  async privateImage(
    user: HydratedDocument<User>,
    id: string,
  ) {
    await this.access.assertModelPermission(
      user,
      'blogs',
      'read',
    );

    return this.image(id, false);
  }
}