import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { Group } from '../schemas/groups.schema';
import { User } from '../schemas/user.schema';
import {
  MODEL_NAME_TO_ACCESS_KEY,
  ModelAccessKey,
  ModelPermission,
} from './access.constants';

export interface CrudAccess {
  read: boolean;
  create: boolean;
  write: boolean;
  delete: boolean;
}

export interface EffectiveAccess {
  menuItemIds: string[];
  modelAccess: Partial<Record<ModelAccessKey, CrudAccess>>;
  currentCompanyId: string | null;
}

const emptyCrudAccess = (): CrudAccess => ({
  read: false,
  create: false,
  write: false,
  delete: false,
});

@Injectable()
export class AccessService {
  constructor(
    @InjectModel(Group.name) private readonly groupModel: Model<Group>,
  ) {}

  modelKeyFor(modelName: string) {
    return MODEL_NAME_TO_ACCESS_KEY[modelName];
  }

  async resolveUserAccess(
    user: HydratedDocument<User>,
    currentCompanyId?: string,
  ): Promise<EffectiveAccess> {
    const normalizedCompanyId = this.assertCompanyContext(
      user,
      currentCompanyId,
    );
    const groupIds = (user.groupIds ?? [])
      .map((groupId) => String(groupId))
      .filter((groupId) => Types.ObjectId.isValid(groupId));

    if (!groupIds.length) {
      return {
        menuItemIds: [],
        modelAccess: {},
        currentCompanyId: normalizedCompanyId,
      };
    }

    const groups = await this.groupModel
      .find({ _id: { $in: groupIds }, active: true })
      .select('companyIds menuItemIds modelAccess')
      .lean()
      .exec();
    const applicableGroups = normalizedCompanyId
      ? groups.filter((group) =>
          (group.companyIds ?? []).some(
            (companyId) => String(companyId) === normalizedCompanyId,
          ),
        )
      : groups;

    const menuItemIds = new Set<string>();
    const modelAccess: Partial<Record<ModelAccessKey, CrudAccess>> = {};

    for (const group of applicableGroups) {
      for (const menuItemId of group.menuItemIds ?? []) {
        menuItemIds.add(menuItemId);
      }
      for (const entry of group.modelAccess ?? []) {
        const current = modelAccess[entry.model] ?? emptyCrudAccess();
        modelAccess[entry.model] = {
          read: current.read || Boolean(entry.read),
          create: current.create || Boolean(entry.create),
          write: current.write || Boolean(entry.write),
          delete: current.delete || Boolean(entry.delete),
        };
      }
    }

    return {
      menuItemIds: Array.from(menuItemIds),
      modelAccess,
      currentCompanyId: normalizedCompanyId,
    };
  }

  async getAllowedMenuIds(
    user: HydratedDocument<User>,
    currentCompanyId?: string,
  ) {
    return (await this.resolveUserAccess(user, currentCompanyId)).menuItemIds;
  }

  async getModelAccess(
    user: HydratedDocument<User>,
    modelKey: ModelAccessKey,
    currentCompanyId?: string,
  ) {
    return (
      (await this.resolveUserAccess(user, currentCompanyId)).modelAccess[
        modelKey
      ] ?? emptyCrudAccess()
    );
  }

  async assertModelPermission(
    user: HydratedDocument<User>,
    modelKey: ModelAccessKey,
    permission: ModelPermission,
    currentCompanyId?: string,
  ) {
    const access = await this.getModelAccess(
      user,
      modelKey,
      currentCompanyId,
    );
    if (!access[permission]) {
      throw new ForbiddenException(
        `You do not have ${permission} access to ${modelKey}.`,
      );
    }
  }

  private assertCompanyContext(
    user: HydratedDocument<User>,
    currentCompanyId?: string,
  ) {
    if (!currentCompanyId) return null;
    if (!Types.ObjectId.isValid(currentCompanyId)) {
      throw new ForbiddenException('The selected Company is invalid.');
    }
    const normalizedCompanyId = new Types.ObjectId(
      currentCompanyId,
    ).toHexString();
    if (user.allowedToAllCompanies) return normalizedCompanyId;

    const allowed = (user.companyIds ?? []).some(
      (companyId) => String(companyId) === normalizedCompanyId,
    );
    if (!allowed) {
      throw new ForbiddenException(
        'You do not have access to the selected Company.',
      );
    }
    return normalizedCompanyId;
  }
}
