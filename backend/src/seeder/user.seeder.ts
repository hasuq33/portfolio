import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserSeeder implements OnModuleInit {
  private readonly logger = new Logger(UserSeeder.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    if (this.configService.get<string>('SEED_DEMO_USER') !== 'true') return;

    const count = await this.userModel.countDocuments();

    if (count > 0) {
      this.logger.log('Users already exist. Skipping seeding.');
      return;
    }

    this.logger.warn('No users found. Creating demo user...');

    const demoPassword =
      this.configService.getOrThrow<string>('SEED_DEMO_PASSWORD');
    if (demoPassword.length < 8)
      throw new Error('SEED_DEMO_PASSWORD must be at least 8 characters.');

    await this.userModel.create({
      login: this.configService.get<string>('SEED_DEMO_LOGIN') ?? 'admin',
      email:
        this.configService.get<string>('SEED_DEMO_EMAIL') ??
        'admin@example.com',
      password: await bcrypt.hash(demoPassword, 10),
      companyName:
        this.configService.get<string>('SEED_DEMO_COMPANY') ?? 'My Company',
    });

    this.logger.log('Demo user created successfully.');
  }
}
