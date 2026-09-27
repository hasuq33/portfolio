import { Types } from 'mongoose';
import { AccessService } from './access.service';
describe('company-scoped model permissions', () => {
  const a = new Types.ObjectId(),
    b = new Types.ObjectId(),
    c = new Types.ObjectId();
  const groups = [
    {
      companyIds: [a],
      modelAccess: [{ model: 'leads', read: true, write: true }],
    },
    {
      companyIds: [b, c],
      modelAccess: [{ model: 'leads', read: true, write: false }],
    },
  ];
  const db = {
    find: jest.fn(() => ({
      select: () => ({ lean: () => ({ exec: async () => groups }) }),
    })),
  };
  const service = new AccessService(db as never);
  const user = {
    groupIds: [new Types.ObjectId()],
    companyIds: [a, b],
    allowedToAllCompanies: false,
  };
  it('intersects membership with applicable permission; never grants company B writes from company A', async () => {
    expect(
      await service.permittedCompanyIds(user as never, 'leads', 'read'),
    ).toEqual([a, b]);
    expect(
      await service.permittedCompanyIds(user as never, 'leads', 'write'),
    ).toEqual([a]);
  });
  it('all-company membership does not bypass model rights', async () => {
    const all = { ...user, companyIds: [], allowedToAllCompanies: true };
    expect(
      await service.permittedCompanyIds(all as never, 'leads', 'read'),
    ).toEqual([a, b, c]);
    expect(
      await service.permittedCompanyIds(all as never, 'leads', 'write'),
    ).toEqual([a]);
  });
  it('respects the selected company', async () => {
    expect(
      await service.permittedCompanyIds(
        user as never,
        'leads',
        'read',
        String(b),
      ),
    ).toEqual([b]);
    expect(
      await service.permittedCompanyIds(
        user as never,
        'leads',
        'write',
        String(b),
      ),
    ).toEqual([]);
    await expect(
      service.permittedCompanyIds(user as never, 'leads', 'read', String(c)),
    ).rejects.toThrow();
  });
});
