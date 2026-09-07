import { Transform, plainToInstance } from 'class-transformer';
import { IsArray, IsBoolean, IsMongoId, IsNotEmpty, IsOptional, IsString, MaxLength, ArrayMaxSize, validate } from 'class-validator';
import { validationExceptionFactory } from '../common/validation-exception.factory';
import { BadRequestException } from '@nestjs/common';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
export class CreateBlogDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(200) title!: string;
  @IsOptional() @IsString() @MaxLength(400) subtitle?: string;
  @IsOptional() @IsString() @MaxLength(160) slug?: string;
  @IsOptional() @IsBoolean() autoSlug?: boolean;
  @IsOptional() @IsMongoId() categoryId?: string | null;
  @IsOptional() @IsString() @MaxLength(500000) contentHtml?: string;
  @IsOptional() @IsString() @MaxLength(200) metaTitle?: string;
  @IsOptional() @IsString() @MaxLength(500) metaDescription?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) @MaxLength(80, { each: true }) metaKeywords?: string[];
  @IsOptional() @IsBoolean() published?: boolean;
}
export class UpdateBlogDto extends CreateBlogDto {}
export class CreateBlogCategoryDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(120) name!: string;
  @IsOptional() @IsString() @MaxLength(160) slug?: string;
  @IsOptional() @IsBoolean() autoSlug?: boolean;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}
export class UpdateBlogCategoryDto extends CreateBlogCategoryDto {}

// Dynamic generic CRUD validates its body after resolving the requested model.
export async function validateBlogDto<T extends object>(type: new () => T, data: unknown, update = false): Promise<T> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new BadRequestException('Submit an object containing the record fields.');
  for (const [field, value] of Object.entries(data)) {
    if (value === null && field !== 'categoryId') throw new BadRequestException({ statusCode: 400, errors: [{ field, message: 'This field cannot be null.' }] });
  }
  const dto = plainToInstance(type, data);
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true, skipMissingProperties: update });
  if (errors.length) throw validationExceptionFactory(errors);
  return Object.fromEntries(Object.entries(dto).filter(([, value]) => value !== undefined)) as T;
}
