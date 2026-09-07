import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { HydratedDocument } from 'mongoose';
import { User } from '../schemas/user.schema';
import { AccessService } from './access.service';
import { ModelPermission } from './access.constants';
import {
  MODEL_ACCESS_REQUIREMENT,
  ModelAccessRequirement,
} from './require-model-access.decorator';

interface AccessRequest extends Request {
  user: HydratedDocument<User>;
}

@Injectable()
export class ModelAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly accessService: AccessService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const requirement = this.reflector.getAllAndOverride<ModelAccessRequirement>(
      MODEL_ACCESS_REQUIREMENT,
      [context.getHandler(), context.getClass()],
    );
    if (!requirement) return true;

    const request = context.switchToHttp().getRequest<AccessRequest>();
    const rawModelName = requirement.modelParam
      ? request.params[requirement.modelParam]
      : undefined;
    const modelKey =
      requirement.modelKey ??
      (rawModelName
        ? this.accessService.modelKeyFor(String(rawModelName))
        : undefined);
    if (!modelKey) {
      throw new ForbiddenException('This model is not registered for access.');
    }

    const rawCompanyId = request.headers['x-company-id'];
    const currentCompanyId = Array.isArray(rawCompanyId)
      ? rawCompanyId[0]
      : rawCompanyId;
    const permission: ModelPermission =
      requirement.permission === 'write' && request.body?.active === false
        ? 'delete'
        : requirement.permission;

    await this.accessService.assertModelPermission(
      request.user,
      modelKey,
      permission,
      currentCompanyId,
    );
    return true;
  }
}
