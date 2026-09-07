import { Types } from 'mongoose';
import { MENU_ITEM_IDS, MODEL_ACCESS_KEYS } from '../access/access.constants';
import { GroupSeeder } from './group.seeder';

const query = <T>(value: T) => ({
  select: jest.fn().mockReturnThis(),
  lean: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue(value),
});

describe('GroupSeeder', () => {
  it('idempotently upserts an Administrator Group with current access', async () => {
    const defaultCompanyId = new Types.ObjectId();
    const secondCompanyId = new Types.ObjectId();
    const groupModel = {
      findOneAndUpdate: jest.fn(() => query({ _id: new Types.ObjectId() })),
    };
    const companyModel = {
      find: jest.fn(() => query([{ _id: secondCompanyId }])),
    };
    const seeder = new GroupSeeder(groupModel as never, companyModel as never);

    await seeder.ensureAdminGroup(defaultCompanyId);

    expect(groupModel.findOneAndUpdate).toHaveBeenCalledWith(
      { name: 'Administrator' },
      {
        $set: expect.objectContaining({
          active: true,
          companyIds: [defaultCompanyId, secondCompanyId],
          menuItemIds: [...MENU_ITEM_IDS],
          modelAccess: expect.arrayContaining(
            MODEL_ACCESS_KEYS.map((model) => expect.objectContaining({ model, read: true, create: true, write: true, delete: true })),
          ),
        }),
      },
      expect.objectContaining({ upsert: true, runValidators: true }),
    );
  });
});
