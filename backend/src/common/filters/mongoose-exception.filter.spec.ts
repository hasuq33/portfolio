import mongoose from 'mongoose';
import type { ArgumentsHost } from '@nestjs/common';
import { MongooseExceptionFilter } from './mongoose-exception.filter';

describe('MongooseExceptionFilter', () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('never echoes rejected values from validation errors', () => {
    const exception = new mongoose.Error.ValidationError();
    exception.addError(
      'password',
      new mongoose.Error.ValidatorError({
        path: 'password',
        message: 'Password is required.',
        value: 'plain-text-secret',
      }),
    );

    new MongooseExceptionFilter().catch(exception, host);

    expect(JSON.stringify(json.mock.calls[0]?.[0])).not.toContain(
      'plain-text-secret',
    );
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: [{ field: 'password', message: 'Password is required.' }],
      }),
    );
  });

  it('returns duplicate field names without echoing their values', () => {
    const exception = Object.assign(new Error('duplicate key'), {
      code: 11000,
      keyPattern: { email: 1 },
      keyValue: { email: 'private@example.com' },
    });

    new MongooseExceptionFilter().catch(exception, host);

    expect(JSON.stringify(json.mock.calls[0]?.[0])).not.toContain(
      'private@example.com',
    );
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ fields: ['email'] }),
    );
  });
});
