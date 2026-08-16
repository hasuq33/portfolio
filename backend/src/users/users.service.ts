import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async findById(id: string) {
    const user = await this.userModel.findById(id).exec();
    if (!user)
      throw new NotFoundException(`User record with ID '${id}' was not found.`);
    return user;
  }

  async getAvatar(id: string) {
    const user = await this.userModel
      .findById(id)
      .select('+avatar_image +avatar_image_mime_type')
      .exec();

    if (!user)
      throw new NotFoundException(`User record with ID '${id}' was not found.`);
    if (!user.avatar_image)
      throw new NotFoundException('This user does not have a profile image.');

    return {
      buffer: user.avatar_image,
      mimeType: user.avatar_image_mime_type || 'application/octet-stream',
    };
  }

  async setAvatar(
    id: string,
    file: { buffer: Buffer; mimetype: string; size: number },
  ) {
    const allowedMimeTypes = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ]);
    if (!allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException(
        'Avatar must be a JPEG, PNG, WebP, or GIF image.',
      );
    }

    const validSignature =
      (file.mimetype === 'image/jpeg' &&
        file.buffer.length >= 3 &&
        file.buffer[0] === 0xff &&
        file.buffer[1] === 0xd8 &&
        file.buffer[2] === 0xff) ||
      (file.mimetype === 'image/png' &&
        file.buffer.length >= 8 &&
        file.buffer
          .subarray(0, 8)
          .equals(
            Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
          )) ||
      (file.mimetype === 'image/gif' &&
        ['GIF87a', 'GIF89a'].includes(
          file.buffer.subarray(0, 6).toString('ascii'),
        )) ||
      (file.mimetype === 'image/webp' &&
        file.buffer.length >= 12 &&
        file.buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
        file.buffer.subarray(8, 12).toString('ascii') === 'WEBP');

    if (!validSignature) {
      throw new BadRequestException(
        'The uploaded file content is not a valid supported image.',
      );
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('Avatar image must be 2 MB or smaller.');
    }

    const user = await this.userModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            avatar_image: file.buffer,
            avatar_image_mime_type: file.mimetype,
            hasAvatar: true,
          },
        },
        { new: true },
      )
      .select('_id hasAvatar')
      .exec();

    if (!user)
      throw new NotFoundException(`User record with ID '${id}' was not found.`);
    return { hasAvatar: true };
  }

  async deleteAvatar(id: string) {
    const user = await this.userModel
      .findByIdAndUpdate(
        id,
        {
          $unset: {
            avatar_image: 1,
            avatar_image_mime_type: 1,
          },
          $set: { hasAvatar: false },
        },
        { new: true },
      )
      .select('_id hasAvatar')
      .exec();

    if (!user)
      throw new NotFoundException(`User record with ID '${id}' was not found.`);
    return { hasAvatar: false };
  }

  async getNavigation(id: string) {
    const currentUser = await this.userModel
      .findById(id)
      .select('_id')
      .lean()
      .exec();
    if (!currentUser)
      throw new NotFoundException(`User record with ID '${id}' was not found.`);

    const [previous, next] = await Promise.all([
      this.userModel
        .findOne({ _id: { $lt: currentUser._id } })
        .sort({ _id: -1 })
        .select('_id name login')
        .lean()
        .exec(),
      this.userModel
        .findOne({ _id: { $gt: currentUser._id } })
        .sort({ _id: 1 })
        .select('_id name login')
        .lean()
        .exec(),
    ]);

    return { previous, next };
  }

  async create(data: Record<string, any>) {
    if (!data.password?.trim())
      throw new BadRequestException('Password is required for a new user.');

    const safeData = { ...data };
    delete safeData.avatar_image;
    delete safeData.avatar_image_mime_type;
    delete safeData.hasAvatar;
    delete safeData.authVersion;
    delete safeData.passwordResetTokenHash;
    delete safeData.passwordResetExpiresAt;

    const password = await bcrypt.hash(data.password, 10);
    const user = new this.userModel({ ...safeData, password });
    const savedUser = await user.save();
    const safeUser = savedUser.toObject() as Record<string, any>;
    delete safeUser.password;
    return safeUser;
  }

  async update(id: string, data: Record<string, any>) {
    const payload = { ...data };
    delete payload._id;
    delete payload.createdAt;
    delete payload.updatedAt;
    delete payload.__v;
    delete payload.avatar_image;
    delete payload.avatar_image_mime_type;
    delete payload.hasAvatar;
    delete payload.authVersion;
    delete payload.passwordResetTokenHash;
    delete payload.passwordResetExpiresAt;

    let passwordChanged = false;
    if (typeof payload.password === 'string' && payload.password.trim()) {
      payload.password = await bcrypt.hash(payload.password, 10);
      passwordChanged = true;
    } else {
      delete payload.password;
    }

    const user = await this.userModel
      .findByIdAndUpdate(
        id,
        passwordChanged
          ? {
              $set: payload,
              $unset: {
                passwordResetTokenHash: 1,
                passwordResetExpiresAt: 1,
              },
              $inc: { authVersion: 1 },
            }
          : payload,
        {
          new: true,
          runValidators: true,
          context: 'query',
        },
      )
      .exec();

    if (!user)
      throw new NotFoundException(`User record with ID '${id}' was not found.`);
    return user;
  }
}
