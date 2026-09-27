import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import type {
  Request,
  Response,
} from 'express';

import type { HydratedDocument } from 'mongoose';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../schemas/user.schema';

import {
  AttachmentsService,
  MAX_IMAGE_BYTES,
} from './attachments.service';

import { Attachment } from './attachments.schema';
import type { UploadedImage } from './types/uploaded-image.type';

type AuthenticatedRequest = Request & {
  user: HydratedDocument<User>;
};

function sendImage(
  response: Response,
  attachment: Attachment,
) {
  response.set({
    'Content-Type': attachment.mimeType,
    'Content-Length': String(attachment.data.length),
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Disposition': 'inline',
  });

  response.send(attachment.data);
}

@Controller('attachments')
@UseGuards(JwtAuthGuard)
export class AttachmentsController {
  constructor(
    private readonly service: AttachmentsService,
  ) {}

  @Post('images')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_IMAGE_BYTES,
        files: 1,
      },
    }),
  )
  upload(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file?: UploadedImage,
  ) {
    return this.service.upload(
      request.user,
      file,
    );
  }

  @Get('images/:id')
  async image(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    const attachment =
      await this.service.privateImage(
        request.user,
        id,
      );

    sendImage(
      response,
      attachment,
    );
  }
}

@Controller('public/attachments')
export class PublicAttachmentsController {
  constructor(
    private readonly service: AttachmentsService,
  ) {}

  @Get('images/:id')
  async image(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    const attachment =
      await this.service.image(
        id,
        true,
      );

    sendImage(
      response,
      attachment,
    );
  }
}