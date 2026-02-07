import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './config/databse.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';

  @Module({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
      }),
      AuthModule,
      CommonModule,
      DatabaseModule
],
  })
  export class AppModule {}
