import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ModelAccessGuard } from '../access/model-access.guard';
import { RequireModelAccess } from '../access/require-model-access.decorator';
import { CrmService, crmContext } from './crm.service';
import type { CrmRequest } from './crm.service';
import type { ModelSearchOptions } from '../common/model-query';

@Controller('crm')
@UseGuards(JwtAuthGuard, ModelAccessGuard)
export class CrmController {
  constructor(private readonly crm: CrmService) {}
  @Post('leads/:id/convert')
  @RequireModelAccess('leads', 'write')
  convert(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() request: CrmRequest,
  ) {
    return this.crm.convert(id, body, crmContext(request));
  }
  @Post('opportunities/:id/status')
  @RequireModelAccess('leads', 'write')
  status(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() request: CrmRequest,
  ) {
    return this.crm.changeStatus(id, body, crmContext(request));
  }
  @Post('lookups/:kind/search')
  @RequireModelAccess('leads', 'read')
  lookup(
    @Param('kind') kind: string,
    @Body() body: ModelSearchOptions,
    @Req() request: CrmRequest,
  ) {
    return this.crm.lookup(kind, body, crmContext(request));
  }
  @Post('lookups/:kind/read')
  @RequireModelAccess('leads', 'read')
  async lookupRead(
    @Param('kind') kind: string,
    @Body('id') id: string,
    @Req() request: CrmRequest,
  ) {
    return (
      (
        await this.crm.lookup(
          kind,
          { domain: [['_id', '=', id]] },
          crmContext(request),
          true,
        )
      )[0] ?? null
    );
  }
}
