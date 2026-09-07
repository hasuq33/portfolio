import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Group, GroupSchema } from '../schemas/groups.schema';
import { AccessService } from './access.service';
import { ModelAccessGuard } from './model-access.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Group.name, schema: GroupSchema }]),
  ],
  providers: [AccessService, ModelAccessGuard],
  exports: [AccessService, ModelAccessGuard],
})
export class AccessModule {}
