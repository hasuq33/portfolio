import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './config/databse.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { MongooseExceptionFilter } from './common/filters/mongoose-exception.filter';
import { APP_FILTER } from '@nestjs/core';
import { UsersModule } from './users/users.module';
import { validateEnvironment } from './config/environment.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    AuthModule,
    CommonModule,
    DatabaseModule,
    UsersModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: MongooseExceptionFilter,
    },
  ],
})
export class AppModule {}
