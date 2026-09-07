import { SetMetadata } from '@nestjs/common';
import { ModelAccessKey, ModelPermission } from './access.constants';

export const MODEL_ACCESS_REQUIREMENT = 'model-access-requirement';

export interface ModelAccessRequirement {
  permission: ModelPermission;
  modelKey?: ModelAccessKey;
  modelParam?: string;
}

export const RequireModelAccess = (
  modelKey: ModelAccessKey,
  permission: ModelPermission,
) =>
  SetMetadata(MODEL_ACCESS_REQUIREMENT, { modelKey, permission });

export const RequireModelParamAccess = (
  modelParam: string,
  permission: ModelPermission,
) =>
  SetMetadata(MODEL_ACCESS_REQUIREMENT, { modelParam, permission });
