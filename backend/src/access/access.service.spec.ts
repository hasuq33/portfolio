import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AccessService } from './access.service';

const query = <T>(value: T) => ({
  select: jest.fn().mockReturnThis(),
  lean: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue(value),
});

describe('AccessService', () => {
  const companyA = new Types.ObjectId();
  const companyB = new Types.ObjectId();

  it('combines menus and CRUD permissions from multiple Groups additively', async () => {
    const groupModel = {
      find: jest.fn(() => query([
        {
          companyIds: [companyA],
          menuItemIds: ['users', 'crm'],
          modelAccess: [{ model: 'users', read: true, create: false, write: false, delete: false }],
        },
        {
          companyIds: [companyB],
          menuItemIds: ['users', 'companies'],
          modelAccess: [{ model: 'users', read: false, create: true, write: true, delete: false }],
        },
      ])),
    };
    const service = new AccessService(groupModel as never);
    const user = {
      groupIds: [new Types.ObjectId(), new Types.ObjectId()],
      companyIds: [companyA, companyB],
      allowedToAllCompanies: false,
    };

    await expect(service.resolveUserAccess(user as never)).resolves.toEqual({
      menuItemIds: ['users', 'crm', 'companies'],
      modelAccess: {
        users: { read: true, create: true, write: true, delete: false },
      },
      currentCompanyId: null,
    });
  });

  it('filters assigned Groups by an explicit current Company', async () => {
    const groupModel = {
      find: jest.fn(() => query([
        {
          companyIds: [companyA],
          menuItemIds: ['users'],
          modelAccess: [{ model: 'users', read: true }],
        },
        {
          companyIds: [companyB],
          menuItemIds: ['companies'],
          modelAccess: [{ model: 'companies', read: true }],
        },
      ])),
    };
    const service = new AccessService(groupModel as never);
    const user = {
      groupIds: [new Types.ObjectId(), new Types.ObjectId()],
      companyIds: [companyA, companyB],
      allowedToAllCompanies: false,
    };

    const access = await service.resolveUserAccess(
      user as never,
      String(companyA).toUpperCase(),
    );
    expect(access.menuItemIds).toEqual(['users']);
    expect(access.modelAccess).toHaveProperty('users.read', true);
    expect(access.modelAccess).not.toHaveProperty('companies');
    expect(access.currentCompanyId).toBe(String(companyA));
  });

  it('allows all-company context without changing Group permissions', async () => {
    const groupModel = {
      find: jest.fn(() => query([
        {
          companyIds: [companyB],
          menuItemIds: ['crm'],
          modelAccess: [{ model: 'users', read: true, create: false }],
        },
      ])),
    };
    const service = new AccessService(groupModel as never);
    const user = {
      groupIds: [new Types.ObjectId()],
      companyIds: [],
      allowedToAllCompanies: true,
    };

    const access = await service.resolveUserAccess(user as never, String(companyB));
    expect(access.modelAccess.users).toEqual({
      read: true,
      create: false,
      write: false,
      delete: false,
    });
  });

  it('rejects a Company outside the User company list', async () => {
    const service = new AccessService({ find: jest.fn() } as never);
    const user = {
      groupIds: [],
      companyIds: [companyA],
      allowedToAllCompanies: false,
    };

    await expect(
      service.resolveUserAccess(user as never, String(companyB)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects model operations not granted by any Group', async () => {
    const groupModel = {
      find: jest.fn(() => query([
        {
          companyIds: [companyA],
          menuItemIds: [],
          modelAccess: [{ model: 'companies', read: true, write: false }],
        },
      ])),
    };
    const service = new AccessService(groupModel as never);
    const user = {
      groupIds: [new Types.ObjectId()],
      companyIds: [companyA],
      allowedToAllCompanies: false,
    };

    await expect(
      service.assertModelPermission(user as never, 'companies', 'write'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
