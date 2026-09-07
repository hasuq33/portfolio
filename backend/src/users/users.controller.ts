import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { ModelAccessGuard } from '../access/model-access.guard';
import { RequireModelAccess } from '../access/require-model-access.decorator';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @UseGuards(ModelAccessGuard)
  @RequireModelAccess('users', 'read')
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get(':id/avatar')
  async getAvatar(@Param('id') id: string, @Res() response: Response) {
    const avatar = await this.usersService.getAvatar(id);
    response.setHeader('Content-Type', avatar.mimeType);
    response.setHeader('Content-Length', avatar.buffer.length);
    response.setHeader('Cache-Control', 'private, no-cache, max-age=0');
    response.send(avatar.buffer);
  }

  @Put(':id/avatar')
  @UseGuards(ModelAccessGuard)
  @RequireModelAccess('users', 'write')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  setAvatar(
    @Param('id') id: string,
    @UploadedFile() file?: { buffer: Buffer; mimetype: string; size: number },
  ) {
    if (!file) throw new BadRequestException('Select an image to upload.');
    return this.usersService.setAvatar(id, file);
  }

  @Delete(':id/avatar')
  @UseGuards(ModelAccessGuard)
  @RequireModelAccess('users', 'write')
  deleteAvatar(@Param('id') id: string) {
    return this.usersService.deleteAvatar(id);
  }

  @Get(':id/navigation')
  @UseGuards(ModelAccessGuard)
  @RequireModelAccess('users', 'read')
  getNavigation(@Param('id') id: string) {
    return this.usersService.getNavigation(id);
  }

  @Post()
  @UseGuards(ModelAccessGuard)
  @RequireModelAccess('users', 'create')
  create(@Body() data: Record<string, any>) {
    return this.usersService.create(data);
  }

  @Put(':id')
  @UseGuards(ModelAccessGuard)
  @RequireModelAccess('users', 'write')
  update(@Param('id') id: string, @Body() data: Record<string, any>) {
    return this.usersService.update(id, data);
  }
}
