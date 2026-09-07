import { BadRequestException, Controller, Delete, Get, Header, Param, Put, Query, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ModelAccessGuard } from '../access/model-access.guard';
import { RequireModelAccess } from '../access/require-model-access.decorator';
import { BlogsService } from './blogs.service';
import type { ImageUpload } from './blogs.service';

function sendImage(response: Response, image: { buffer: Buffer; mimeType: string }) {
  response.setHeader('Content-Type', image.mimeType);
  response.setHeader('Content-Length', image.buffer.length);
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Cache-Control', 'no-store');
  response.send(image.buffer);
}
@Controller('public/blogs')
export class PublicBlogsController {
  constructor(private readonly blogs: BlogsService) {}
  @Get() @Header('Cache-Control', 'no-store')
  search(@Query('search') search?: string, @Query('category') category?: string, @Query('page') page?: string) {
    return this.blogs.publicSearch(typeof search === 'string' ? search : '', typeof category === 'string' ? category : '', Number(page));
  }
  @Get('categories') categories() { return this.blogs.publicCategories(); }
  @Get('images/:id/:kind')
  async image(@Param('id') id: string, @Param('kind') kind: string, @Res() response: Response) {
    sendImage(response, await this.blogs.image(id, kind, true));
  }
  @Get(':slug') @Header('Cache-Control', 'no-store')
  detail(@Param('slug') slug: string) { return this.blogs.publicDetail(slug); }
}

@Controller('blogs')
@UseGuards(JwtAuthGuard, ModelAccessGuard)
export class BlogsController {
  constructor(private readonly blogs: BlogsService) {}
  @Get('slug-availability') @RequireModelAccess('blogs', 'read')
  availability(@Query('slug') slug?: string, @Query('excludeId') excludeId?: string) {
    return this.blogs.slugAvailability(typeof slug === 'string' ? slug : '', excludeId);
  }
  @Get(':id/images/:kind') @RequireModelAccess('blogs', 'read')
  async image(@Param('id') id: string, @Param('kind') kind: string, @Res() response: Response) {
    sendImage(response, await this.blogs.image(id, kind));
  }
  @Put(':id/images/:kind') @RequireModelAccess('blogs', 'write')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }))
  setImage(@Param('id') id: string, @Param('kind') kind: string, @UploadedFile() file?: ImageUpload) {
    if (!file) throw new BadRequestException('Select an image to upload.');
    return this.blogs.setImage(id, kind, file);
  }
  @Delete(':id/images/:kind') @RequireModelAccess('blogs', 'write')
  deleteImage(@Param('id') id: string, @Param('kind') kind: string) { return this.blogs.setImage(id, kind); }
}
