import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model, SortOrder } from 'mongoose';

@Injectable()
export class CommonService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  private getModel(modelName: string): Model<any> {
    const model = this.connection.model(modelName);
    if (!model)
      throw new Error(`Model '${modelName}' not found in Mongoose connection.`);

    return model;
  }

  async create(modelName: string, data: any) {
    if (modelName === 'User') {
      throw new BadRequestException(
        'Use the protected users endpoint to create users.',
      );
    }
    const model = this.getModel(modelName);
    const doc = new model(data);
    await doc.validate();
    return doc.save();
  }

  async findAll(modelName: string, filter: any = {}) {
    const model = this.getModel(modelName);
    return model.find(filter).exec();
  }

  async findById(modelName: string, id: string) {
    const model = this.getModel(modelName);
    const document = await model.findById(id).exec();

    if (!document) {
      throw new NotFoundException(
        `${modelName} record with ID '${id}' was not found.`,
      );
    }

    return document;
  }

  async update(modelName: string, id: string, data: any) {
    if (modelName === 'User' && 'password' in data) {
      throw new BadRequestException(
        'Use the protected users endpoint to change a password.',
      );
    }
    const model = this.getModel(modelName);
    const document = await model
      .findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
        context: 'query',
      })
      .exec();

    if (!document) {
      throw new NotFoundException(
        `${modelName} record with ID '${id}' was not found.`,
      );
    }

    return document;
  }

  async delete(modelName: string, id: string) {
    const model = this.getModel(modelName);
    const document = await model.findByIdAndDelete(id).exec();

    if (!document) {
      throw new NotFoundException(
        `${modelName} record with ID '${id}' was not found.`,
      );
    }

    return document;
  }

  private addOperator(
    filter: Record<string, any>,
    field: string,
    operator: string,
    value: any,
  ) {
    filter[field] = {
      ...(filter[field] || {}),
      [operator]: value,
    };
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private domainToMongo(domain: [string, string, any][]) {
    const filter: Record<string, any> = {};

    for (const [field, operator, value] of domain) {
      switch (operator) {
        case '=':
          filter[field] = value;
          break;

        case '!=':
          this.addOperator(filter, field, '$ne', value);
          break;

        case '>':
          this.addOperator(filter, field, '$gt', value);
          break;

        case '<':
          this.addOperator(filter, field, '$lt', value);
          break;

        case '>=':
          this.addOperator(filter, field, '$gte', value);
          break;

        case '<=':
          this.addOperator(filter, field, '$lte', value);
          break;

        case 'in':
          this.addOperator(filter, field, '$in', value);
          break;

        case 'not in':
          this.addOperator(filter, field, '$nin', value);
          break;

        case 'contains':
          filter[field] = {
            $regex: this.escapeRegex(String(value)),
            $options: 'i',
          };
          break;

        default:
          throw new BadRequestException(
            `Unsupported domain operator: ${operator}`,
          );
      }
    }

    return filter;
  }

  private orderToMongo(order: string): Record<string, SortOrder> {
    if (!order) return {};
    const sort: Record<string, SortOrder> = {};
    const parts = order.split(',');

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const [field, direction] = trimmed.split(/\s+/);

      sort[field] = direction.toLowerCase() === 'desc' ? -1 : 1;
    }

    return sort;
  }

  async searchRead(
    modelName: string,
    options: {
      domain?: [string, string, any][];
      order?: string;
      limit?: number;
      offset?: number;
      fields?: string[];
      search?: {
        query?: string;
        fields?: string[];
      };
      withCount?: boolean;
    },
  ) {
    const model = this.getModel(modelName);
    const {
      domain = [],
      order = 'createdAt desc',
      limit: requestedLimit = 20,
      offset: requestedOffset = 0,
      fields = [],
      search,
      withCount = false,
    } = options;

    const limit = Math.min(Math.max(Number(requestedLimit) || 20, 1), 200);
    const offset = Math.max(Number(requestedOffset) || 0, 0);

    const domainFilter = this.domainToMongo(domain);
    const searchQuery = search?.query?.trim();
    const searchableFields = (search?.fields ?? []).filter((field) =>
      Boolean(model.schema.path(field)),
    );
    const searchFilter =
      searchQuery && searchableFields.length
        ? {
            $or: searchableFields.map((field) => ({
              [field]: {
                $regex: this.escapeRegex(searchQuery),
                $options: 'i',
              },
            })),
          }
        : null;
    const filter = searchFilter
      ? { $and: [domainFilter, searchFilter] }
      : domainFilter;
    const sort = this.orderToMongo(order);

    const query = model.find(filter);

    if (fields.length) {
      const safeFields =
        modelName === 'User'
          ? fields.filter((field) => field !== 'password')
          : fields;
      query.select(safeFields.join(' '));
    }

    query.sort(sort).skip(offset).limit(limit);
    if (!withCount) return query.exec();

    const [records, total] = await Promise.all([
      query.exec(),
      model.countDocuments(filter).exec(),
    ]);
    return { records, total, limit, offset };
  }
}
