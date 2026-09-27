import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import mongoose, { Connection } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { validationExceptionFactory } from '../common/validation-exception.factory';

// Opt-in real MongoDB test. The configured application database is never used for writes.
const describeMongo = process.env.CRM_TEST_MONGO_URI ? describe : describe.skip;
describeMongo(
  'CRM HTTP integration with real MongoDB and JWT/group guards',
  () => {
    let app: INestApplication, connection: Connection;
    const dbName = 'codex_crm_test_' + randomUUID().replaceAll('-', '');
    let a: any, b: any, admin: any, reader: any, foreign: any, mixed: any;
    let adminCookie: string,
      readerCookie: string,
      foreignCookie: string,
      mixedCookie: string;
    let leadId: string, firstStageId: string;
    const token = (user: any) =>
      'access_token=' +
      app.get(JwtService).sign(
        {
          sub: String(user._id),
          login: user.login,
          sid: 'integration',
          jti: randomUUID(),
          ver: 0,
          type: 'access',
        },
        { secret: process.env.JWT_ACCESS_SECRET, expiresIn: '10m' },
      );
    const post = (url: string, data: object, cookie = adminCookie) =>
      request(app.getHttpServer()).post(url).set('Cookie', cookie).send(data);
    const put = (id: string, data: object, cookie = adminCookie) =>
      request(app.getHttpServer())
        .put('/api/CrmLead/' + id)
        .set('Cookie', cookie)
        .send(data);

    beforeAll(async () => {
      process.env.NODE_ENV = 'test';
      process.env.SEED_DEMO_USER = 'false';
      process.env.JWT_ACCESS_SECRET =
        'crm-test-access-secret-at-least-32-characters';
      process.env.JWT_REFRESH_SECRET =
        'crm-test-refresh-secret-at-least-32-characters';
      process.env.ALLOWED_URL = 'http://localhost:3000';
      process.env.MONGODB_URI = process.env.CRM_TEST_MONGO_URI;
      connection = await mongoose
        .createConnection(process.env.CRM_TEST_MONGO_URI!, {
          dbName,
          serverSelectionTimeoutMS: 5000,
        })
        .asPromise();
      const { AppModule } =
        require('../app.module') as typeof import('../app.module');
      const module = await Test.createTestingModule({ imports: [AppModule] })
        .overrideProvider(getConnectionToken())
        .useValue(connection)
        .compile();
      app = module.createNestApplication({ logger: false });
      app.use(cookieParser());
      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
          exceptionFactory: validationExceptionFactory,
        }),
      );
      await app.init();
      await Promise.all(
        Object.values(connection.models).map((model) => model.init()),
      );
      a = await connection
        .model('Company')
        .create({ name: 'CRM Test A', code: 'CRM_TEST_A' });
      b = await connection
        .model('Company')
        .create({ name: 'CRM Test B', code: 'CRM_TEST_B' });
      const group = async (name: string, companies: any[], write: boolean) =>
        connection.model('Group').create({
          name,
          companyIds: companies.map((c) => c._id),
          menuItemIds: ['crm'],
          modelAccess: [
            {
              model: 'leads',
              read: true,
              create: write,
              write,
              delete: write,
            },
          ],
        });
      const ga = await group('Writer A', [a], true),
        gb = await group('Writer B', [b], true),
        gr = await group('Reader A', [a], false),
        rb = await group('Reader B', [b], false);
      const user = async (name: string, companies: any[], groups: any[]) =>
        connection.model('User').create({
          name,
          login: name,
          email: name + '@example.test',
          password: 'not-used-for-authentication',
          companyIds: companies.map((c) => c._id),
          groupIds: groups.map((g) => g._id),
          status: 'active',
        });
      admin = await user('crmadmin', [a], [ga]);
      reader = await user('crmreader', [a], [gr]);
      foreign = await user('crmforeign', [b], [gb]);
      mixed = await user('crmmixed', [a, b], [ga, rb]);
      adminCookie = token(admin);
      readerCookie = token(reader);
      foreignCookie = token(foreign);
      mixedCookie = token(mixed);
    }, 60000);
    afterAll(async () => {
      if (connection?.readyState === 1) {
        if (
          connection.name !== dbName ||
          !/^codex_crm_test_[a-f0-9]{32}$/.test(connection.name)
        )
          throw new Error(
            'Refusing cleanup outside the isolated CRM test database.',
          );
        await connection.dropDatabase();
      }
      if (app) await app.close();
      else if (connection) await connection.close();
    }, 30000);

    it('starts the complete backend and rejects unauthenticated CRM access', async () => {
      expect(
        (
          await request(app.getHttpServer())
            .post('/api/CrmLead/search')
            .send({})
        ).status,
      ).toBe(401);
    });
    it('creates a lead and seeds company stages once', async () => {
      const created = await post('/api/CrmLead', {
        name: 'ERP requirement',
        companyId: String(a._id),
        contactName: 'Jane',
        email: 'jane@example.test',
        userId: String(admin._id),
        priority: 'high',
        source: 'Custom channel',
        description: 'Preserve notes',
      });
      expect(created.status).toBe(201);
      leadId = created.body._id;
      expect(created.body).toMatchObject({
        type: 'lead',
        status: 'open',
        expectedRevenue: 0,
        probability: 0,
      });
      expect(
        await connection.model('CrmStage').countDocuments({ companyId: a._id }),
      ).toBe(5);
      const stages = await post('/api/CrmStage/search', {
        order: 'sequence asc',
      });
      firstStageId = stages.body[0]._id;
      await post('/api/CrmLead', {
        name: 'Second requirement',
        companyId: String(a._id),
      }).expect(201);
      expect(
        await connection.model('CrmStage').countDocuments({ companyId: a._id }),
      ).toBe(5);
    });
    it('rejects field errors and client-written business state/audit fields', async () => {
      for (const data of [
        { name: '  ' },
        { email: 'wrong' },
        { probability: 101 },
        { probability: -1 },
        { expectedRevenue: -1 },
        { priority: 'urgent' },
        { type: 'won' },
        { companyId: 'bad-id' },
        { userId: 'bad-id' },
        { status: 'won' },
        { convertedBy: String(admin._id) },
        { dateClosed: '2026-01-01' },
        { tagIds: [{}] },
      ]) {
        const result = await post('/api/CrmLead', {
          name: 'Invalid',
          companyId: String(a._id),
          ...data,
        });
        expect(result.status).toBe(400);
      }
      for (const data of [
        { type: 'opportunity' },
        { status: 'lost' },
        { name: null },
        { probability: null },
      ])
        expect((await put(leadId, data)).status).toBe(400);
    });
    it('enforces company scope for create/read/search/update/delete/conversion', async () => {
      await post('/api/CrmLead', {
        name: 'Forbidden',
        companyId: String(b._id),
      }).expect(403);
      await post('/api/CrmLead/read', { id: leadId }, foreignCookie).expect(
        404,
      );
      const search = await post(
        '/api/CrmLead/search',
        { withCount: true, domain: [['_id', '=', leadId]] },
        foreignCookie,
      ).expect(201);
      expect(search.body.total).toBe(0);
      await put(leadId, { name: 'Forbidden' }, foreignCookie).expect(404);
      await post('/crm/leads/' + leadId + '/convert', {}, foreignCookie).expect(
        404,
      );
      await request(app.getHttpServer())
        .delete('/api/CrmLead/' + leadId)
        .set('Cookie', foreignCookie)
        .expect(404);
      await post('/api/CrmLead/search', {})
        .set('X-Company-Id', String(b._id))
        .expect(403);
    });
    it('prevents unioned group permissions from leaking writes across companies', async () => {
      const record = await post(
        '/api/CrmLead',
        { name: 'Company B lead', companyId: String(b._id) },
        foreignCookie,
      ).expect(201);
      const visible = await post(
        '/api/CrmLead/read',
        { id: record.body._id },
        mixedCookie,
      ).expect(201);
      expect(visible.body._access.write).toBe(false);
      await put(
        record.body._id,
        { name: 'Forbidden write' },
        mixedCookie,
      ).expect(404);
      await post(
        '/crm/leads/' + record.body._id + '/convert',
        {},
        mixedCookie,
      ).expect(404);
    });
    it('read-only users can view but cannot create, edit, convert or delete', async () => {
      await post('/api/CrmLead/read', { id: leadId }, readerCookie).expect(201);
      await post(
        '/api/CrmLead',
        { name: 'No', companyId: String(a._id) },
        readerCookie,
      ).expect(403);
      await put(leadId, { name: 'No' }, readerCookie).expect(403);
      await post('/crm/leads/' + leadId + '/convert', {}, readerCookie).expect(
        403,
      );
      await request(app.getHttpServer())
        .delete('/api/CrmLead/' + leadId)
        .set('Cookie', readerCookie)
        .expect(403);
    });
    it('validates relations and supports proper tags', async () => {
      const tag = await post('/api/CrmTag', {
        name: 'ERP',
        companyId: String(a._id),
        color: '#2563eb',
      }).expect(201);
      await put(leadId, { tagIds: [tag.body._id] }).expect(200);
      await put(leadId, { userId: String(foreign._id) }).expect(400);
      const other = await post(
        '/api/CrmTag',
        { name: 'Private', companyId: String(b._id) },
        foreignCookie,
      ).expect(201);
      await put(leadId, { tagIds: [other.body._id] }).expect(400);
      const otherStage = await connection
        .model('CrmStage')
        .findOne({ companyId: b._id });
      await put(leadId, { stageId: String(otherStage._id) }).expect(400);
      await post('/api/CrmTag', {
        name: 'ERP',
        companyId: String(a._id),
      }).expect(409);
    });
    it('casts the exact widget company domain and returns tag display colors', async () => {
      for (const model of ['CrmLead', 'CrmStage', 'CrmTag']) expect(connection.model(model).schema.path('companyId').instance).toBe('ObjectId');
      const result = await post('/api/CrmTag/search', {
        fields: ['_id', 'name', 'color'], domain: [['companyId', '=', String(a._id)]],
        search: { query: 'ERP', fields: ['name'] }, limit: 100, offset: 0, order: 'name asc',
      }).set('X-Company-Id', String(a._id)).expect(201);
      expect(result.body).toHaveLength(1);
      expect(result.body[0]).toMatchObject({ name: 'ERP', color: '#2563eb' });
      expect(result.body[0].companyId).toBeUndefined();
      const denied = await post('/api/CrmTag/search', { domain: [['companyId', '=', String(b._id)]] }).expect(201);
      expect(denied.body).toEqual([]);
    });
    it('persists three tag IDs and removal on both leads and opportunities', async () => {
      const ids: string[] = [];
      for (const name of ['First tag', 'Second tag', 'Third tag']) ids.push((await post('/api/CrmTag', { name, companyId: String(a._id) }).expect(201)).body._id);
      for (const type of ['lead', 'opportunity']) {
        const created = await post('/api/CrmLead', { name: 'Tag persistence ' + type, type, companyId: String(a._id), tagIds: ids }).expect(201);
        const read = await post('/api/CrmLead/read', { id: created.body._id }).expect(201);
        expect(read.body.tagIds).toEqual(ids);
        const stored = await connection.model('CrmLead').collection.findOne({ _id: new mongoose.Types.ObjectId(created.body._id) });
        expect(stored!.tagIds.every((id: unknown) => id instanceof mongoose.Types.ObjectId)).toBe(true);
        await put(created.body._id, { tagIds: [ids[0], ids[2]] }).expect(200);
        const updated = await post('/api/CrmLead/read', { id: created.body._id }).expect(201);
        expect(updated.body.tagIds).toEqual([ids[0], ids[2]]);
        const display = await post('/api/CrmTag/search', { fields: ['_id', 'name', 'color'], domain: [['companyId', '=', String(a._id)], ['_id', 'in', updated.body.tagIds]] }).expect(201);
        expect(display.body.map((record: any) => record.name).sort()).toEqual(['First tag', 'Third tag']);
      }
    });
    it('protects case-insensitive tag uniqueness and enforces company-specific creation permissions', async () => {
      const raced = await Promise.all(['Concurrent', 'concurrent'].map(name => post('/api/CrmTag', { name, companyId: String(a._id), color: '' })));
      expect(raced.map(result => result.status).sort()).toEqual([201, 409]);
      const colored = await post('/api/CrmTag', { name: 'Color editing', companyId: String(a._id), color: '#3b82f6' }).expect(201);
      await request(app.getHttpServer()).put('/api/CrmTag/' + colored.body._id).set('Cookie', adminCookie).send({ color: '' }).expect(200);
      expect((await post('/api/CrmTag/read', { id: colored.body._id }).expect(201)).body.color).toBe('');
      await post('/api/CrmTag', { name: 'erp', companyId: String(a._id) }).expect(409);
      await post('/api/CrmTag', { name: 'erp', companyId: String(b._id) }, foreignCookie).expect(201);
      await post('/api/CrmTag', { name: 'Not allowed', companyId: String(a._id) }, readerCookie).expect(403);
      await post('/api/CrmTag', { name: 'Invalid color', companyId: String(a._id), color: 'bg-blue-500' }).expect(400);
      expect((await post('/api/CrmTag/access', {}, readerCookie).set('X-Company-Id', String(a._id)).expect(201)).body.create).toBe(false);
      expect((await post('/api/CrmTag/access', {}, mixedCookie).set('X-Company-Id', String(a._id)).expect(201)).body.create).toBe(true);
      expect((await post('/api/CrmTag/access', {}, mixedCookie).set('X-Company-Id', String(b._id)).expect(201)).body.create).toBe(false);
      await post('/api/CrmTag/access', {}).set('X-Company-Id', String(b._id)).expect(403);
    });
    it('converts in place exactly once under concurrent requests and preserves details', async () => {
      await connection
        .model('CrmStage')
        .updateOne(
          { _id: firstStageId },
          { $set: { name: 'Renamed first stage', sequence: 2 } },
        );
      const before = await connection
        .model('CrmLead')
        .findById(leadId)
        .lean<any>();
      const results = await Promise.all([
        post('/crm/leads/' + leadId + '/convert', {}),
        post('/crm/leads/' + leadId + '/convert', {}),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
      const converted = results.find((r) => r.status === 201)!.body;
      expect(converted).toMatchObject({
        _id: leadId,
        type: 'opportunity',
        status: 'open',
        stageId: firstStageId,
        convertedBy: String(admin._id),
        description: 'Preserve notes',
        source: 'Custom channel',
      });
      expect(converted.createdAt).toBe(before.createdAt.toISOString());
      expect(converted.tagIds.map(String)).toEqual(before.tagIds.map(String));
      expect(
        await connection.model('CrmLead').countDocuments({ _id: leadId }),
      ).toBe(1);
      await post('/crm/leads/' + leadId + '/convert', {}).expect(409);
    });
    it('supports stage-only updates and rejects inactive targets', async () => {
      const next = await connection
        .model('CrmStage')
        .findOne({ companyId: a._id, sequence: 20 });
      await put(leadId, { stageId: String(next._id) }).expect(200);
      await connection
        .model('CrmStage')
        .updateOne({ _id: firstStageId }, { $set: { active: false } });
      await put(leadId, { stageId: firstStageId }).expect(400);
    });
    it('marks lost/won and reopens without changing type, preserving the lost reason', async () => {
      await post(
        '/crm/opportunities/' + leadId + '/status',
        { status: 'lost', lostReason: 'No budget' },
        readerCookie,
      ).expect(403);
      const lost = await post('/crm/opportunities/' + leadId + '/status', {
        status: 'lost',
        lostReason: 'No budget',
      }).expect(201);
      expect(lost.body).toMatchObject({
        status: 'lost',
        type: 'opportunity',
        lostReason: 'No budget',
      });
      expect(lost.body.dateClosed).toBeTruthy();
      await post('/crm/opportunities/' + leadId + '/status', {
        status: 'won',
      }).expect(409);
      const reopened = await post('/crm/opportunities/' + leadId + '/status', {
        status: 'open',
      }).expect(201);
      expect(reopened.body).toMatchObject({
        status: 'open',
        dateClosed: null,
        lostReason: 'No budget',
      });
      const won = await post('/crm/opportunities/' + leadId + '/status', {
        status: 'won',
      }).expect(201);
      expect(won.body.status).toBe('won');
      expect(won.body.dateClosed).toBeTruthy();
    });
    it('separates lists and supports search, pagination, sorting and safe projections', async () => {
      const leads = await post('/api/CrmLead/search', {
        domain: [['type', '=', 'lead']],
        withCount: true,
        limit: 1,
        offset: 0,
        order: 'name asc',
      }).expect(201);
      expect(leads.body.records).toHaveLength(1);
      expect(leads.body.records[0].type).toBe('lead');
      const opps = await post('/api/CrmLead/search', {
        domain: [['type', '=', 'opportunity']],
        search: { query: 'Jane', fields: ['contactName'] },
        withCount: true,
      }).expect(201);
      expect(opps.body.records.map((r) => r._id)).toEqual([leadId]);
      await post('/api/CrmLead/search', {
        domain: [['companyId', '=', { $ne: null }]],
      }).expect(400);
      await post('/api/CrmLead/search', { fields: ['$where'] }).expect(400);
      const choices = await post('/crm/lookups/users/search', {
        fields: ['_id', 'name'],
      }).expect(201);
      expect(choices.body.some((r) => r._id === String(foreign._id))).toBe(
        false,
      );
      expect(choices.body.every((r) => !r.password && !r.email)).toBe(true);
    });
    it('does not let archive permission grant unrelated stage edits', async () => {
      const group = await connection.model('Group').create({
        name: 'Archive only',
        companyIds: [a._id],
        modelAccess: [{ model: 'leads', read: true, delete: true }],
      });
      const actor = await connection.model('User').create({
        name: 'Archive only',
        login: 'archive-only',
        email: 'archive-only@example.test',
        password: 'unused',
        companyIds: [a._id],
        groupIds: [group._id],
      });
      const cookie = token(actor);
      const stage = await connection
        .model('CrmStage')
        .findOne({ companyId: a._id, sequence: 30 });
      await request(app.getHttpServer())
        .put('/api/CrmStage/' + stage._id)
        .set('Cookie', cookie)
        .send({ active: false, name: 'Unauthorized rename' })
        .expect(403);
      await request(app.getHttpServer())
        .put('/api/CrmStage/' + stage._id)
        .set('Cookie', cookie)
        .send({ active: false })
        .expect(200);
    });
    it('keeps historical assignments when a salesperson becomes inactive', async () => {
      const salesperson = await connection.model('User').create({
        name: 'Former salesperson',
        login: 'former-salesperson',
        email: 'former-salesperson@example.test',
        password: 'unused',
        companyIds: [a._id],
        status: 'active',
      });
      await put(leadId, { userId: String(salesperson._id) }).expect(200);
      await connection
        .model('User')
        .updateOne({ _id: salesperson._id }, { $set: { status: 'inactive' } });
      const updated = await put(leadId, {
        description: 'Updated historical notes',
        userId: String(salesperson._id),
      }).expect(200);
      expect(updated.body.userId).toBe(String(salesperson._id));
      expect(updated.body.description).toBe('Updated historical notes');
      const historical = await post('/crm/lookups/users/read', {
        id: String(salesperson._id),
      }).expect(201);
      expect(historical.body.name).toBe('Former salesperson');
    });
    it('creates an opportunity directly with its first active stage and supports permitted deletion', async () => {
      const record = await post('/api/CrmLead', {
        name: 'Direct opportunity',
        type: 'opportunity',
        companyId: String(a._id),
      }).expect(201);
      expect(record.body.type).toBe('opportunity');
      expect(record.body.stageId).toBeTruthy();
      expect(record.body.stageId).not.toBe(firstStageId);
      await request(app.getHttpServer())
        .delete('/api/CrmLead/' + record.body._id)
        .set('Cookie', adminCookie)
        .expect(200);
      await post('/api/CrmLead/read', { id: record.body._id }).expect(404);
    });
  },
);
