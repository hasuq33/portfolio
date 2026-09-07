import { Module } from '@nestjs/common';
import { DatabaseModule } from '../config/databse.module';
import { CommonController } from './common.controller';
import { CommonService } from './common.service';
import { AuthModule } from '../auth/auth.module';
import { AccessModule } from '../access/access.module';
import { BlogsModule } from '../blogs/blogs.module';

@Module({
  imports: [AuthModule, AccessModule, DatabaseModule, BlogsModule],
  controllers: [CommonController],
  exports: [CommonService],
  providers: [CommonService],
})
export class CommonModule {}
