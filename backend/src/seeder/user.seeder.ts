import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { CompanySeeder } from './company.seeder';
import { GroupSeeder } from './group.seeder';

@Injectable()
export class UserSeeder implements OnModuleInit {
  private readonly logger = new Logger(UserSeeder.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly configService: ConfigService,
    private readonly companySeeder: CompanySeeder,
    private readonly groupSeeder: GroupSeeder,
  ) {}

  async onModuleInit() {
    if (this.configService.get<string>('SEED_DEMO_USER') !== 'true') return;

    const company = await this.companySeeder.ensureDemoCompany();
    const adminGroup = await this.groupSeeder.ensureAdminGroup(company._id);
    const login = this.configService.get<string>('SEED_DEMO_LOGIN') ?? 'admin';
    const email =
      this.configService.get<string>('SEED_DEMO_EMAIL') ??
      'admin@example.com';
    const existingDemoUser = await this.userModel
      .findOne({ $or: [{ login }, { email: email.toLowerCase() }] })
      .exec();

    if (existingDemoUser) {
      await this.userModel
        .updateOne(
          { _id: existingDemoUser._id },
          {
            $addToSet: {
              companyIds: company._id,
              groupIds: adminGroup._id,
            },
            $set: { allowedToAllCompanies: true },
            $unset: { companyName: 1 },
          },
          { strict: false },
        )
        .exec();
      this.logger.log('Demo user company access is ready.');
      return;
    }

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
      login,
      email,
      password: await bcrypt.hash(demoPassword, 10),
      companyIds: [company._id],
      groupIds: [adminGroup._id],
      allowedToAllCompanies: true,
    });

    this.logger.log('Demo user created successfully.');
  }
}
