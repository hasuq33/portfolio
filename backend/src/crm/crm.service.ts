import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, HydratedDocument, Model, Types } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AccessService } from '../access/access.service';
import { ModelPermission } from '../access/access.constants';
import { User } from '../schemas/user.schema';
import { validationExceptionFactory } from '../common/validation-exception.factory';
import { buildModelQuery, ModelSearchOptions } from '../common/model-query';
import {
  CreateCrmLeadDto,
  UpdateCrmLeadDto,
  CrmStageDto,
  CrmTagDto,
  ConvertLeadDto,
  UpdateOpportunityStatusDto,
} from './dto/crm.dto';
import { CrmStageSeeder } from './crm-stage.seeder';

export interface CrmContext {
  user: HydratedDocument<User>;
  companyId?: string;
}
export interface CrmRequest {
  user: HydratedDocument<User>;
  headers: Record<string, string | string[] | undefined>;
}
export const crmContext = (request: CrmRequest): CrmContext => ({
  user: request.user,
  companyId: Array.isArray(request.headers['x-company-id'])
    ? request.headers['x-company-id'][0]
    : request.headers['x-company-id'],
});
export const isCrmModel = (model: string) =>
  ['CrmLead', 'CrmStage', 'CrmTag'].includes(model);

@Injectable()
export class CrmService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly access: AccessService,
    private readonly seeder: CrmStageSeeder,
  ) {}
  private model(name: string): Model<any> {
    if (!isCrmModel(name)) throw new BadRequestException('Unknown CRM model.');
    return this.connection.model(name);
  }
  private id(value: unknown) {
    if (typeof value !== 'string' || !/^[a-f\d]{24}$/i.test(value))
      throw new BadRequestException('Invalid record ID.');
    return new Types.ObjectId(value);
  }
  private async scope(context: CrmContext, permission: ModelPermission) {
    const ids = await this.access.permittedCompanyIds(
      context.user,
      'leads',
      permission,
      context.companyId,
    );
    if (!ids.length)
      throw new ForbiddenException(
        `You do not have ${permission} access to CRM in any allowed company.`,
      );
    return { companyId: { $in: ids } };
  }
  private async dto<T extends object>(
    ctor: new () => T,
    raw: unknown,
    partial = false,
  ) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw))
      throw new BadRequestException('Expected a record object.');
    if (ctor === ConvertLeadDto) {
      if (Object.keys(raw).length)
        throw new BadRequestException(
          'Conversion does not accept additional fields.',
        );
      return {} as Record<string, any>;
    }
    // Optional clearing is allowed only for nullable references/date, not required/numeric fields.
    const nullable = ['userId', 'stageId', 'dateDeadline'];
    for (const [field, value] of Object.entries(raw)) {
      if (value === null && !nullable.includes(field))
        throw new BadRequestException({
          message: 'The submitted data is invalid.',
          errors: [{ field, message: `${field} cannot be null.` }],
        });
    }
    const data = plainToInstance(ctor, raw);
    const errors = await validate(data, {
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: partial,
    });
    if (errors.length) throw validationExceptionFactory(errors);
    return Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined),
    ) as Record<string, any>;
  }
  private async requireCompany(
    context: CrmContext,
    id: unknown,
    permission: ModelPermission,
  ) {
    const scope = await this.scope(context, permission);
    const companyId = this.id(String(id ?? ''));
    if (!scope.companyId.$in.some((item) => item.equals(companyId)))
      throw new ForbiddenException('You do not have access to this company.');
    if (
      !(await this.connection
        .model('Company')
        .exists({ _id: companyId, active: true }))
    )
      throw new BadRequestException('Choose an active company.');
    return companyId;
  }
  private async relations(
    record: Record<string, any>,
    original?: Record<string, any>,
  ) {
    const companyId = record.companyId;
    if (
      record.userId &&
      (!original || String(record.userId) !== String(original.userId)) &&
      !(await this.connection.model('User').exists({
        _id: record.userId,
        status: 'active',
        $or: [{ companyIds: companyId }, { allowedToAllCompanies: true }],
      }))
    )
      this.fieldError(
        'userId',
        'Choose an active salesperson with access to this company.',
      );
    if (
      record.stageId &&
      !(await this.model('CrmStage').exists({ _id: record.stageId, companyId }))
    )
      this.fieldError('stageId', 'Choose a stage from this company.');
    if (record.tagIds?.length) {
      const count = await this.model('CrmTag')
        .countDocuments({ _id: { $in: record.tagIds }, companyId })
        .exec();
      if (count !== record.tagIds.length)
        this.fieldError('tagIds', 'All tags must belong to this company.');
    }
  }
  private fieldError(field: string, message: string): never {
    throw new BadRequestException({
      message: 'The submitted data is invalid.',
      errors: [{ field, message }],
    });
  }
  private async present(record: any, context: CrmContext) {
    const data =
      typeof record.toObject === 'function' ? record.toObject() : record;
    return {
      ...data,
      _access: await this.access.getModelAccess(
        context.user,
        'leads',
        String(data.companyId),
      ),
    };
  }
  async create(model: string, raw: unknown, context: CrmContext) {
    const data = await this.dto(
      model === 'CrmLead'
        ? CreateCrmLeadDto
        : model === 'CrmStage'
          ? CrmStageDto
          : CrmTagDto,
      raw,
    );
    data.companyId = await this.requireCompany(
      context,
      data.companyId,
      'create',
    );
    if (model === 'CrmLead') {
      await this.seeder.ensureDefaults(data.companyId);
      if (data.type === 'opportunity' && !data.stageId)
        data.stageId = await this.firstStage(data.companyId);
      if (
        data.stageId &&
        !(await this.model('CrmStage').exists({
          _id: data.stageId,
          companyId: data.companyId,
          active: true,
        }))
      )
        this.fieldError('stageId', 'Choose an active stage.');
      if (!data.dateDeadline) data.dateDeadline = null;
      await this.relations(data);
    }
    return this.present(await this.model(model).create(data), context);
  }
  async read(
    model: string,
    id: string,
    context: CrmContext,
    permission: ModelPermission = 'read',
  ) {
    const scope = await this.scope(context, permission);
    const record = await this.model(model)
      .findOne({ _id: this.id(id), ...scope })
      .lean<Record<string, any>>()
      .exec();
    if (!record)
      throw new NotFoundException(
        'CRM record not found or unavailable in your companies.',
      );
    return permission === 'read' ? this.present(record, context) : record;
  }
  async update(model: string, id: string, raw: unknown, context: CrmContext) {
    const permission =
      model === 'CrmStage' && (raw as any)?.active === false
        ? 'delete'
        : 'write';
    const old = await this.read(model, id, context, permission);
    if (
      permission === 'delete' &&
      Object.keys(raw as object).some((field) => field !== 'active')
    ) {
      await this.read(model, id, context, 'write');
    }
    const data = await this.dto(
      model === 'CrmLead'
        ? UpdateCrmLeadDto
        : model === 'CrmStage'
          ? CrmStageDto
          : CrmTagDto,
      raw,
      true,
    );
    // Moving a record between companies is deliberately not part of this first CRM version.
    if (data.companyId && String(data.companyId) !== String(old.companyId))
      this.fieldError(
        'companyId',
        'The company cannot be changed after creation.',
      );
    if (model === 'CrmLead') {
      if (old.type === 'opportunity' && 'stageId' in data && !data.stageId)
        data.stageId = await this.firstStage(old.companyId);
      if ('dateDeadline' in data && !data.dateDeadline)
        data.dateDeadline = null;
      if (
        data.stageId &&
        String(data.stageId) !== String(old.stageId) &&
        !(await this.model('CrmStage').exists({
          _id: data.stageId,
          companyId: old.companyId,
          active: true,
        }))
      )
        this.fieldError('stageId', 'Choose an active stage.');
      await this.relations({ ...old, ...data }, old);
    }
    const result = await this.model(model)
      .findOneAndUpdate(
        {
          _id: this.id(id),
          ...(await this.scope(context, permission)),
          updatedAt: old.updatedAt,
        },
        { $set: data },
        { new: true, runValidators: true },
      )
      .exec();
    if (!result)
      throw new ConflictException(
        'This record changed. Reload it before saving.',
      );
    return this.present(result, context);
  }
  async remove(model: string, id: string, context: CrmContext) {
    const record = await this.read(model, id, context, 'delete');
    if (model !== 'CrmLead') {
      // Archive stages instead of deleting them; tag removal is similarly disabled to keep references stable.
      throw new BadRequestException(
        model === 'CrmStage'
          ? 'Archive stages instead of deleting them.'
          : 'Tags cannot be deleted in this version; rename unused tags instead.',
      );
    }
    return this.model(model)
      .findOneAndDelete({
        _id: record._id,
        ...(await this.scope(context, 'delete')),
      })
      .exec();
  }
  async search(
    model: string,
    options: ModelSearchOptions,
    context: CrmContext,
  ) {
    const scope = await this.scope(context, 'read');
    const db = this.model(model);
    const allowed = Object.keys(db.schema.paths).filter(
      (f) => !['__v', 'seedKey'].includes(f),
    );
    const searchable =
      model === 'CrmLead'
        ? ['name', 'contactName', 'companyName', 'email', 'phone', 'source']
        : ['name'];
    const query = buildModelQuery(options, allowed, searchable);
    const filter = { $and: [scope, query.filter] };
    let result = db
      .find(filter)
      .sort(query.sort)
      .skip(query.offset)
      .limit(query.limit);
    if (query.fields.length) result = result.select(query.fields.join(' '));
    if (model === 'CrmLead')
      result = result
        .populate({
          path: 'userId',
          select: 'name',
          match: {
            $or: [
              { companyIds: scope.companyId },
              { allowedToAllCompanies: true },
            ],
          },
        })
        .populate({ path: 'stageId', select: 'name', match: scope });
    else if (!query.fields.length || query.fields.includes('companyId'))
      result = result.populate({
        path: 'companyId',
        select: 'name',
        match: { _id: scope.companyId },
      });
    const records = await result.lean().exec();
    if (!options.withCount) return records;
    return {
      records,
      total: await db.countDocuments(filter).exec(),
      limit: query.limit,
      offset: query.offset,
    };
  }
  private async firstStage(companyId: Types.ObjectId) {
    const stage = await this.model('CrmStage')
      .findOne({ companyId, active: true })
      .sort({ sequence: 1, _id: 1 })
      .exec();
    if (!stage)
      this.fieldError(
        'stageId',
        'Create or activate a CRM stage for this company first.',
      );
    return stage._id;
  }
  async convert(id: string, raw: unknown, context: CrmContext) {
    await this.dto(ConvertLeadDto, raw);
    const lead = await this.read('CrmLead', id, context, 'write');
    if (lead.type !== 'lead')
      throw new ConflictException('This lead is already an opportunity.');
    await this.seeder.ensureDefaults(lead.companyId);
    const stageId = lead.stageId ?? (await this.firstStage(lead.companyId));
    const result = await this.model('CrmLead')
      .findOneAndUpdate(
        {
          _id: lead._id,
          type: 'lead',
          updatedAt: lead.updatedAt,
          ...(await this.scope(context, 'write')),
        },
        {
          $set: {
            type: 'opportunity',
            convertedAt: new Date(),
            convertedBy: context.user._id,
            status: 'open',
            stageId,
          },
          $unset: { dateClosed: 1 },
        },
        { new: true, runValidators: true },
      )
      .exec();
    if (!result)
      throw new ConflictException(
        'The record changed or was already converted. Reload it.',
      );
    return this.present(result, context);
  }
  async changeStatus(id: string, raw: unknown, context: CrmContext) {
    const data = await this.dto(UpdateOpportunityStatusDto, raw);
    const record = await this.read('CrmLead', id, context, 'write');
    if (record.type !== 'opportunity')
      throw new BadRequestException(
        'Convert this lead before changing its opportunity status.',
      );
    if (
      data.status === record.status ||
      (record.status !== 'open' && data.status !== 'open')
    )
      throw new ConflictException(
        'Reopen a closed opportunity before marking it won or lost.',
      );
    if (data.lostReason !== undefined && data.status !== 'lost')
      this.fieldError(
        'lostReason',
        'A lost reason is only accepted when marking an opportunity lost.',
      );
    const changes: Record<string, unknown> = {
      status: data.status,
      dateClosed: data.status === 'open' ? null : new Date(),
    };
    if (data.status === 'lost') changes.lostReason = data.lostReason ?? '';
    const saved = await this.model('CrmLead')
      .findOneAndUpdate(
        {
          _id: record._id,
          type: 'opportunity',
          status: record.status,
          updatedAt: record.updatedAt,
          ...(await this.scope(context, 'write')),
        },
        { $set: changes },
        { new: true, runValidators: true },
      )
      .exec();
    if (!saved)
      throw new ConflictException('This opportunity changed. Reload it.');
    return this.present(saved, context);
  }
  async lookup(
    kind: string,
    options: ModelSearchOptions,
    context: CrmContext,
    includeInactive = false,
  ) {
    const scope = await this.scope(context, 'read');
    if (!['companies', 'users'].includes(kind))
      throw new NotFoundException('Unknown lookup.');
    const fields =
      kind === 'companies'
        ? ['_id', 'name', 'code', 'active', 'createdAt']
        : ['_id', 'name', 'status', 'createdAt'];
    const query = buildModelQuery(options, fields, ['name']);
    const filter =
      kind === 'companies'
        ? { _id: scope.companyId, ...(includeInactive ? {} : { active: true }) }
        : {
            ...(includeInactive ? {} : { status: 'active' }),
            $or: [
              { companyIds: scope.companyId },
              { allowedToAllCompanies: true },
            ],
          };
    return this.connection
      .model(kind === 'companies' ? 'Company' : 'User')
      .find({ $and: [filter, query.filter] })
      .select(kind === 'companies' ? 'name code active' : 'name status')
      .sort(query.sort)
      .skip(query.offset)
      .limit(query.limit)
      .lean()
      .exec();
  }
}
