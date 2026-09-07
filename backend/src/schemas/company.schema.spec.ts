import { CompanySchema } from './company.schema';

describe('CompanySchema', () => {
  it('defines the Company master fields and archive default', () => {
    for (const field of [
      'name',
      'code',
      'email',
      'phone',
      'website',
      'street',
      'street2',
      'city',
      'state',
      'zip',
      'country',
      'active',
    ]) {
      expect(CompanySchema.path(field)).toBeDefined();
    }
    expect(CompanySchema.path('active').options.default).toBe(true);
  });

  it('keeps company codes unique', () => {
    expect(CompanySchema.indexes()).toEqual(
      expect.arrayContaining([
        [{ code: 1 }, expect.objectContaining({ unique: true })],
      ]),
    );
  });
});
