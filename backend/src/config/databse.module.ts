import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PartnerSchema,
  UserSchema,
  LeadSchema,
  TagsSchema,
  BlogsSchema,
  IRConfigSchema,
} from '../schemas';
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Partner', schema: PartnerSchema },
      { name: 'Lead', schema: LeadSchema },
      { name: 'Tags', schema: TagsSchema },
      { name: 'Blogs', schema: BlogsSchema },
      { name: 'ir.configuration', schema: IRConfigSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
