import { CompanySeeder } from './company.seeder';

const query = <T>(value: T) => ({
  exec: jest.fn().mockResolvedValue(value),
});

describe('CompanySeeder', () => {
  it('idempotently upserts the MAIN demo company', async () => {
    const companyModel = {
      findOneAndUpdate: jest.fn(() => query({ _id: 'company-id' })),
    };
    const values: Record<string, string> = {
      SEED_DEMO_USER: 'true',
      SEED_DEMO_COMPANY: 'My Company',
      SEED_DEMO_COMPANY_CODE: 'MAIN',
    };
    const configService = {
      get: jest.fn((name: string) => values[name]),
    };

    const seeder = new CompanySeeder(
      companyModel as never,
      configService as never,
    );
    await seeder.onModuleInit();

    expect(companyModel.findOneAndUpdate).toHaveBeenCalledWith(
      { code: 'MAIN' },
      {
        $setOnInsert: {
          name: 'My Company',
          code: 'MAIN',
          active: true,
        },
      },
      expect.objectContaining({ upsert: true, runValidators: true }),
    );
  });
});
