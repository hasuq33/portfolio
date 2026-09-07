import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company } from '../schemas/company.schema';

@Injectable()
export class CompanySeeder implements OnModuleInit {
  private readonly logger = new Logger(CompanySeeder.name);

  constructor(
    @InjectModel(Company.name) private readonly companyModel: Model<Company>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    if (this.configService.get<string>('SEED_DEMO_USER') !== 'true') return;

    await this.ensureDemoCompany();
  }

  async ensureDemoCompany() {

    const name =
      this.configService.get<string>('SEED_DEMO_COMPANY') ?? 'My Company';
    const code =
      this.configService.get<string>('SEED_DEMO_COMPANY_CODE') ?? 'MAIN';

    const company = await this.companyModel
      .findOneAndUpdate(
        { code: code.trim().toUpperCase() },
        {
          $setOnInsert: {
            name,
            code: code.trim().toUpperCase(),
            active: true,
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      )
      .exec();

    if (!company) throw new Error('The demo company could not be created.');

    this.logger.log('Demo company is ready.');
    return company;
  }
}
