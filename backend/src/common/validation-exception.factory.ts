import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

export function validationExceptionFactory(
  validationErrors: ValidationError[],
) {
  const errors = flattenValidationErrors(validationErrors);
  return new BadRequestException({
    statusCode: 400,
    error: 'Validation Error',
    message: 'The submitted data is invalid.',
    errors,
  });
}

function flattenValidationErrors(
  validationErrors: ValidationError[],
  parentPath = '',
): Array<{ field: string; message: string }> {
  return validationErrors.flatMap((validationError) => {
    const field = parentPath
      ? `${parentPath}.${validationError.property}`
      : validationError.property;
    const currentErrors = Object.values(validationError.constraints ?? {}).map(
      (message) => ({ field, message }),
    );
    return [
      ...currentErrors,
      ...flattenValidationErrors(validationError.children ?? [], field),
    ];
  });
}
