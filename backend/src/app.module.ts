  import { Module } from '@nestjs/common';
  import { AppController } from './app.controller';
  import { AppService } from './app.service';
  import { ConfigModule } from '@nestjs/config';
  import { MongooseModule } from '@nestjs/mongoose';
  import { DatabaseModule } from './config/databse.module';
  import { CommonModule } from './common/common.module';

  @Module({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
      }),
      CommonModule,
      DatabaseModule
],
  })
  export class AppModule {}
