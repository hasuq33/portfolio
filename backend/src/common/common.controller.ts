import {
  Controller,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Logger,
  Req,
} from '@nestjs/common';
import { CommonService } from './common.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ModelAccessGuard } from '../access/model-access.guard';
import { RequireModelParamAccess } from '../access/require-model-access.decorator';

// Common API Model Sharable which Can be Scallable by Model and Need to find the Data by accessrigght
/**
 * I am gonna implement the Controller API as Like SmartMiddleare which use Groups
 * with authentication
 *
 * Web Request ---> Authentication middleware --> Check Group --> Fetch Data
 */
@UseGuards(JwtAuthGuard, ModelAccessGuard)
@Controller('api/:model')
export class CommonController {
  constructor(private readonly commonService: CommonService) {}
  private readonly logger = new Logger(CommonController.name);

  @Post()
  @RequireModelParamAccess('model', 'create')
  async create(@Param('model') model: string, @Body() data: any, @Req() request: { user: { _id: unknown } }) {
    this.logger.log(`api/${model}`);
    return this.commonService.create(model, data, String(request.user._id));
  }

  @Post('search')
  @RequireModelParamAccess('model', 'read')
  async searchRead(
    @Param('model') model: string,
    @Body()
    body: {
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
    this.logger.log(`SEARCH api/${model}`);
    return this.commonService.searchRead(model, body);
  }

  @Post('read')
  @RequireModelParamAccess('model', 'read')
  async read(@Param('model') model: string, @Body('id') id: string) {
    this.logger.log(`READ api/${model}/${id}`);
    return this.commonService.findById(model, id);
  }

  @Put(':id')
  @RequireModelParamAccess('model', 'write')
  async update(
    @Param('model') model: string,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.commonService.update(model, id, data);
  }

  @Delete(':id')
  @RequireModelParamAccess('model', 'delete')
  async delete(@Param('model') model: string, @Param('id') id: string) {
    return this.commonService.delete(model, id);
  }
}
