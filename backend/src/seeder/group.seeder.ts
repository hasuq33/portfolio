import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ADMIN_MODEL_ACCESS,
  MENU_ITEM_IDS,
} from '../access/access.constants';
import { Company } from '../schemas/company.schema';
import { Group } from '../schemas/groups.schema';

@Injectable()
export class GroupSeeder {
  private readonly logger = new Logger(GroupSeeder.name);

  constructor(
    @InjectModel(Group.name) private readonly groupModel: Model<Group>,
    @InjectModel(Company.name) private readonly companyModel: Model<Company>,
  ) {}

  async ensureAdminGroup(defaultCompanyId: Types.ObjectId) {
    const companies = await this.companyModel
      .find({ active: true })
      .select('_id')
      .lean()
      .exec();
    const companyIds = Array.from(
      new Map(
        [defaultCompanyId, ...companies.map((company) => company._id)].map(
          (companyId) => [String(companyId), companyId],
        ),
      ).values(),
    );
    const group = await this.groupModel
      .findOneAndUpdate(
        { name: 'Administrator' },
        {
          $set: {
            description: 'Full access to the current ERP menus and models.',
            active: true,
            companyIds,
            menuItemIds: [...MENU_ITEM_IDS],
            modelAccess: ADMIN_MODEL_ACCESS,
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

    if (!group) throw new Error('The Administrator Group could not be created.');
    this.logger.log('Administrator Group is ready.');
    return group;
  }
}
