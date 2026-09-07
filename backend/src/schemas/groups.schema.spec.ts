import mongoose, { Types } from 'mongoose';
import { MENU_ITEM_IDS } from '../access/access.constants';
import { GroupSchema } from './groups.schema';

const createGroupModel = () =>
  mongoose.model(`GroupSchemaTest${new Types.ObjectId()}`, GroupSchema.clone());

describe('GroupSchema', () => {
  it('defines company, menu, model access, and archive fields', () => {
    const companyIds = GroupSchema.path('companyIds') as mongoose.Schema.Types.Array;

    expect((companyIds.caster as mongoose.SchemaType).options.ref).toBe('Company');
    expect(GroupSchema.path('menuItemIds')).toBeDefined();
    expect(GroupSchema.path('modelAccess')).toBeDefined();
    expect(GroupSchema.path('active').options.default).toBe(true);
  });

  it('accepts multiple Companies and current stable menu keys', async () => {
    const GroupModel = createGroupModel();
    const companyIds = [new Types.ObjectId(), new Types.ObjectId()];
    const group = new GroupModel({
      name: 'Sales Manager',
      companyIds,
      menuItemIds: [...MENU_ITEM_IDS, 'users'],
      modelAccess: [
        { model: 'users', read: true, create: false, write: true, delete: false },
      ],
    });

    await expect(group.validate()).resolves.toBeUndefined();
    expect(group.companyIds.map(String)).toEqual(companyIds.map(String));
    expect(group.menuItemIds).toEqual(MENU_ITEM_IDS);
  });

  it('rejects invalid menu IDs and duplicate model access entries', async () => {
    const GroupModel = createGroupModel();
    const invalidMenu = new GroupModel({
      name: 'Invalid Menu',
      companyIds: [new Types.ObjectId()],
      menuItemIds: ['not-a-menu'],
    });
    const duplicateModel = new GroupModel({
      name: 'Duplicate Model',
      companyIds: [new Types.ObjectId()],
      modelAccess: [
        { model: 'users', read: true },
        { model: 'users', create: true },
      ],
    });

    await expect(invalidMenu.validate()).rejects.toMatchObject({
      errors: expect.objectContaining({ 'menuItemIds.0': expect.anything() }),
    });
    await expect(duplicateModel.validate()).rejects.toMatchObject({
      errors: expect.objectContaining({ modelAccess: expect.anything() }),
    });
  });
});
