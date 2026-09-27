import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  ArrayMaxSize,
  ArrayUnique,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CrmPriority, CrmType } from '../schemas/crm-lead.schema';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
export class CrmLeadFieldsDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(trim)
  contactName?: string;
  @IsOptional() @IsString() @MaxLength(500) @Transform(trim) phone?: string;
  @IsOptional() @IsString() @MaxLength(500) @Transform(trim) mobile?: string;
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(trim)
  companyName?: string;
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(trim)
  jobPosition?: string;
  @IsOptional() @IsString() @MaxLength(500) @Transform(trim) street?: string;
  @IsOptional() @IsString() @MaxLength(500) @Transform(trim) street2?: string;
  @IsOptional() @IsString() @MaxLength(500) @Transform(trim) city?: string;
  @IsOptional() @IsString() @MaxLength(500) @Transform(trim) state?: string;
  @IsOptional() @IsString() @MaxLength(500) @Transform(trim) zip?: string;
  @IsOptional() @IsString() @MaxLength(500) @Transform(trim) country?: string;
  @IsOptional() @IsString() @MaxLength(500) @Transform(trim) source?: string;
  @IsOptional()
  @ValidateIf((_o, v) => v !== '')
  @IsEmail()
  @MaxLength(500)
  email?: string;
  @IsOptional()
  @ValidateIf((_o, v) => v !== '')
  @IsUrl({ protocols: ['https', 'http'], require_protocol: true })
  @MaxLength(500)
  website?: string;
  @IsOptional() @IsMongoId() userId?: string | null;
  @IsOptional() @IsMongoId() stageId?: string | null;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsMongoId({ each: true })
  tagIds?: string[];
  @IsOptional() @IsEnum(CrmPriority) priority?: CrmPriority;
  @IsOptional() @IsNumber() @Min(0) expectedRevenue?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) probability?: number;
  @IsOptional() @IsString() @MaxLength(20000) description?: string;
  @IsOptional() @ValidateIf((_o, v) => v !== '') @IsDateString() dateDeadline?:
    string | null;
}
export class CreateCrmLeadDto extends CrmLeadFieldsDto {
  @IsString() @IsNotEmpty() @MaxLength(200) @Transform(trim) name!: string;
  @IsMongoId() companyId!: string;
  @IsOptional() @IsEnum(CrmType) type?: CrmType;
}
export class UpdateCrmLeadDto extends CrmLeadFieldsDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(trim)
  name?: string;
  @IsOptional() @IsMongoId() companyId?: string;
}
export class ConvertLeadDto {}
export class UpdateOpportunityStatusDto {
  @IsEnum(['open', 'won', 'lost']) status!: 'open' | 'won' | 'lost';
  @IsOptional() @IsString() @MaxLength(2000) lostReason?: string;
}
export class CrmStageDto {
  @IsString() @IsNotEmpty() @MaxLength(100) @Transform(trim) name!: string;
  @IsMongoId() companyId!: string;
  @IsOptional() @IsInt() @Min(0) sequence?: number;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsBoolean() fold?: boolean;
  @IsOptional() @IsNumber() @Min(0) @Max(100) probability?: number;
}
export class CrmTagDto {
  @IsString() @IsNotEmpty() @MaxLength(100) @Transform(trim) name!: string;
  @IsMongoId() companyId!: string;
  @IsOptional()
  @ValidateIf((_o, v) => v !== '')
  @Matches(/^#[0-9a-fA-F]{6}$/)
  color?: string;
}
