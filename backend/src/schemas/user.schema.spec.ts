import mongoose, { Types } from 'mongoose';
import { UserSchema } from './user.schema';

describe('UserSchema company references', () => {
  it('uses a multi-company reference and an all-companies flag', () => {
    const companyIds = UserSchema.path('companyIds') as mongoose.Schema.Types.Array;
    const groupIds = UserSchema.path('groupIds') as mongoose.Schema.Types.Array;

    expect(UserSchema.path('companyName')).toBeUndefined();
    expect(companyIds).toBeDefined();
    expect((companyIds.caster as mongoose.SchemaType).options.ref).toBe('Company');
    expect(companyIds.options.default).toEqual([]);
    expect((groupIds.caster as mongoose.SchemaType).options.ref).toBe('Group');
    expect(groupIds.options.default).toEqual([]);
    expect(UserSchema.path('allowedToAllCompanies').options.default).toBe(false);
  });

  it('rejects malformed company ObjectIds', async () => {
    const UserModel = mongoose.model(`UserSchemaTest${new Types.ObjectId()}`, UserSchema.clone());
    const user = new UserModel({
      login: 'schema-test',
      email: 'schema-test@example.com',
      password: 'password-hash',
      companyIds: ['not-an-object-id'],
    });

    await expect(user.validate()).rejects.toMatchObject({
      errors: expect.objectContaining({ 'companyIds.0': expect.anything() }),
    });
  });

  it('accepts multiple Company ObjectIds', async () => {
    const UserModel = mongoose.model(`UserCompanyIdsTest${new Types.ObjectId()}`, UserSchema.clone());
    const companyIds = [new Types.ObjectId(), new Types.ObjectId()];
    const user = new UserModel({
      login: 'multi-company-test',
      email: 'multi-company@example.com',
      password: 'password-hash',
      companyIds,
    });

    await expect(user.validate()).resolves.toBeUndefined();
    expect(user.companyIds.map(String)).toEqual(companyIds.map(String));
  });
});
