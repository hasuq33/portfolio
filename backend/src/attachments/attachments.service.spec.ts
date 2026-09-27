import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import sharp from 'sharp';
import { AttachmentsService } from './attachments.service';

describe('Blog attachments', () => {
  const attachments = { create: jest.fn(), findById: jest.fn() };
  const blogs = { exists: jest.fn() };
  const access = {
    getModelAccess: jest.fn(),
    assertModelPermission: jest.fn(),
  };
  const service = new AttachmentsService(
    attachments as never,
    blogs as never,
    access as never,
  );
  const user = { _id: new Types.ObjectId() } as never;
  const id = String(new Types.ObjectId());

  beforeEach(() => {
    jest.resetAllMocks();
    access.getModelAccess.mockResolvedValue({
      read: true,
      create: true,
      write: false,
    });
  });

  it('decodes raster images and stores binary WebP with server-controlled metadata', async () => {
    const buffer = await sharp({
      create: { width: 4, height: 3, channels: 3, background: '#ffffff' },
    })
      .png()
      .toBuffer();
    attachments.create.mockImplementation(async (payload) => ({
      ...payload,
      _id: id,
    }));
    const result = await service.upload(user, {
      buffer,
      size: buffer.length,
      mimetype: 'image/png',
      originalname: 'test.png',
    });
    expect(result).toEqual({
      id,
      url: `/editor-media/${id}`,
      width: 4,
      height: 3,
    });
    const payload = attachments.create.mock.calls[0][0];
    expect(Buffer.isBuffer(payload.data)).toBe(true);
    expect(payload.mimeType).toBe('image/webp');
    expect(payload.createdBy).toEqual((user as { _id: Types.ObjectId })._id);
    expect(payload).not.toHaveProperty('public');
  });

  it('rejects missing, disguised, oversized, and undecodable images', async () => {
    await expect(service.upload(user)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      service.upload(user, {
        buffer: Buffer.from('<svg/>'),
        size: 6,
        mimetype: 'image/png',
        originalname: 'x.png',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.upload(user, {
        buffer: Buffer.from([255, 216, 255]),
        size: 3,
        mimetype: 'image/jpeg',
        originalname: 'x.jpg',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.upload(user, {
        buffer: Buffer.from([255, 216, 255]),
        size: 3 * 1024 * 1024,
        mimetype: 'image/jpeg',
        originalname: 'x.jpg',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(attachments.create).not.toHaveBeenCalled();
  });

  it('requires Blog read plus create or write access for uploads', async () => {
    access.getModelAccess.mockResolvedValue({
      read: true,
      create: false,
      write: false,
    });
    await expect(service.upload(user)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    access.getModelAccess.mockResolvedValue({
      read: false,
      create: true,
      write: true,
    });
    await expect(service.upload(user)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rechecks published references on every public image request', async () => {
    const attachment = { data: Buffer.from('image'), mimeType: 'image/webp' };
    attachments.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(attachment),
    });
    blogs.exists.mockResolvedValue(null);
    await expect(service.image(id, true)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(attachments.findById).not.toHaveBeenCalled();
    blogs.exists.mockResolvedValue({ _id: 'published-blog' });
    await expect(service.image(id, true)).resolves.toBe(attachment);
    expect(blogs.exists).toHaveBeenLastCalledWith({
      published: true,
      contentAttachmentIds: new Types.ObjectId(id),
    });
    blogs.exists.mockResolvedValue(null);
    await expect(service.image(id, true)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('checks permissions for draft previews and rejects invalid IDs', async () => {
    access.assertModelPermission.mockRejectedValue(new ForbiddenException());
    await expect(service.privateImage(user, id)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(attachments.findById).not.toHaveBeenCalled();
    await expect(service.image('invalid', true)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(blogs.exists).not.toHaveBeenCalled();
  });
});
