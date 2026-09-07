import { ForbiddenException } from '@nestjs/common';
import { ModelAccessGuard } from './model-access.guard';

describe('ModelAccessGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  const accessService = {
    modelKeyFor: jest.fn((modelName: string) => modelName === 'Company' ? 'companies' : undefined),
    assertModelPermission: jest.fn(),
  };
  const context = (request: Record<string, unknown>) => ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  });

  beforeEach(() => jest.clearAllMocks());

  it('requires delete permission when an update archives a record', async () => {
    reflector.getAllAndOverride.mockReturnValue({
      modelParam: 'model',
      permission: 'write',
    });
    accessService.assertModelPermission.mockResolvedValue(undefined);
    const guard = new ModelAccessGuard(reflector as never, accessService as never);

    await expect(guard.canActivate(context({
      params: { model: 'Company' },
      body: { active: false },
      headers: {},
      user: { _id: 'user-id' },
    }) as never)).resolves.toBe(true);
    expect(accessService.assertModelPermission).toHaveBeenCalledWith(
      expect.anything(),
      'companies',
      'delete',
      undefined,
    );
  });

  it('rejects models not registered in the access catalog', async () => {
    reflector.getAllAndOverride.mockReturnValue({
      modelParam: 'model',
      permission: 'read',
    });
    const guard = new ModelAccessGuard(reflector as never, accessService as never);

    await expect(guard.canActivate(context({
      params: { model: 'Unknown' },
      body: {},
      headers: {},
      user: { _id: 'user-id' },
    }) as never)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
