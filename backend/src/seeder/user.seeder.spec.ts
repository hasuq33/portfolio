import { Types } from 'mongoose';
import { UserSeeder } from './user.seeder';

const query = <T>(value: T) => ({
  exec: jest.fn().mockResolvedValue(value),
});

describe('UserSeeder company assignment', () => {
  const companyId = new Types.ObjectId();
  const values: Record<string, string> = {
    SEED_DEMO_USER: 'true',
    SEED_DEMO_LOGIN: 'admin',
    SEED_DEMO_EMAIL: 'admin@example.com',
    SEED_DEMO_PASSWORD: 'password123',
  };
  const configService = {
    get: jest.fn((name: string) => values[name]),
    getOrThrow: jest.fn((name: string) => values[name]),
  };
  const companySeeder = {
    ensureDemoCompany: jest.fn().mockResolvedValue({ _id: companyId }),
  };
  const groupId = new Types.ObjectId();
  const groupSeeder = {
    ensureAdminGroup: jest.fn().mockResolvedValue({ _id: groupId }),
  };

  it('creates the first demo admin with access to the seeded company', async () => {
    const userModel = {
      findOne: jest.fn(() => query(null)),
      countDocuments: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
    };
    const seeder = new UserSeeder(
      userModel as never,
      configService as never,
      companySeeder as never,
      groupSeeder as never,
    );

    await seeder.onModuleInit();

    expect(userModel.create).toHaveBeenCalledWith(expect.objectContaining({
      companyIds: [companyId],
      groupIds: [groupId],
      allowedToAllCompanies: true,
    }));
  });

  it('updates an existing demo admin without creating another user', async () => {
    const userId = new Types.ObjectId();
    const updateQuery = query({ modifiedCount: 1 });
    const userModel = {
      findOne: jest.fn(() => query({ _id: userId })),
      updateOne: jest.fn(() => updateQuery),
      countDocuments: jest.fn(),
      create: jest.fn(),
    };
    const seeder = new UserSeeder(
      userModel as never,
      configService as never,
      companySeeder as never,
      groupSeeder as never,
    );

    await seeder.onModuleInit();

    expect(userModel.updateOne).toHaveBeenCalledWith(
      { _id: userId },
      expect.objectContaining({
        $addToSet: {
          companyIds: companyId,
          groupIds: groupId,
        },
        $set: { allowedToAllCompanies: true },
        $unset: { companyName: 1 },
      }),
      { strict: false },
    );
    expect(userModel.create).not.toHaveBeenCalled();
  });
});
