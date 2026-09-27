import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { AccessModule } from '../access/access.module';
import { CrmLead, CrmLeadSchema } from './schemas/crm-lead.schema';
import { CrmStage, CrmStageSchema } from './schemas/crm-stage.schema';
import { CrmTag, CrmTagSchema } from './schemas/crm-tag.schema';
import { CrmService } from './crm.service';
import { CrmController } from './crm.controller';
import { CrmStageSeeder } from './crm-stage.seeder';

@Module({
  imports: [
    AuthModule,
    AccessModule,
    MongooseModule.forFeature([
      { name: CrmLead.name, schema: CrmLeadSchema },
      { name: CrmStage.name, schema: CrmStageSchema },
      { name: CrmTag.name, schema: CrmTagSchema },
    ]),
  ],
  controllers: [CrmController],
  providers: [CrmService, CrmStageSeeder],
  exports: [CrmService],
})
export class CrmModule {}
