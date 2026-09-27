import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CrmStage } from './schemas/crm-stage.schema';

@Injectable()
export class CrmStageSeeder {
  constructor(
    @InjectModel(CrmStage.name) private readonly stages: Model<CrmStage>,
  ) {}
  // Called for the selected company on its first CRM create/conversion.
  // $setOnInsert never overwrites a renamed, reordered or archived stage.
  async ensureDefaults(companyId: Types.ObjectId) {
    const names = ['New', 'Qualified', 'Proposition', 'Negotiation', 'Won'];
    await Promise.all(
      names.map(async (name, index) => {
        const seedKey = String(index + 1);
        try {
          await this.stages
            .updateOne(
              { companyId, seedKey },
              {
                $setOnInsert: {
                  name,
                  companyId,
                  seedKey,
                  sequence: (index + 1) * 10,
                  active: true,
                  fold: index === 4,
                },
              },
              { upsert: true },
            )
            .exec();
        } catch (error) {
          if ((error as { code?: number }).code !== 11000) throw error;
        }
      }),
    );
  }
}
