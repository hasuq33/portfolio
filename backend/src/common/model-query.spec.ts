import { buildModelQuery } from './model-query';
const fields = ['_id', 'name', 'companyId', 'type', 'createdAt'];
describe('allowlisted model queries', () => {
  it('escapes search text and keeps domain conditions separate', () => {
    const q = buildModelQuery(
      {
        domain: [['type', '=', 'lead']],
        search: { query: 'a.*[b]', fields: ['name'] },
      },
      fields,
      ['name'],
    );
    expect(q.filter).toEqual({
      $and: [
        { type: { $eq: 'lead' } },
        { $or: [{ name: { $regex: 'a\\.\\*\\[b\\]', $options: 'i' } }] },
      ],
    });
    expect(q.sort).toEqual({ createdAt: -1, _id: 1 });
  });
  it.each([
    { domain: [['companyId', '=', { $ne: null }]] },
    { domain: [['$where', '=', 'evil']] },
    { domain: [['name', '__proto__', 'evil']] },
    { fields: ['+password'] },
    { fields: ['seedKey'] },
    { order: 'password desc' },
    { offset: -1 },
    { limit: 201 },
    { search: { query: 'x', fields: ['companyId'] } },
    { unknown: true },
  ])('rejects unsafe or malformed options %j', (raw) => {
    expect(() => buildModelQuery(raw as never, fields, ['name'])).toThrow();
  });
  it('supports pagination and multiple safe sorts', () => {
    expect(
      buildModelQuery(
        { limit: 12, offset: 24, order: 'name asc, createdAt desc' },
        fields,
        ['name'],
      ),
    ).toMatchObject({
      limit: 12,
      offset: 24,
      sort: { name: 1, createdAt: -1, _id: 1 },
    });
  });
});
