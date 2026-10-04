import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsUrl,
  ValidateIf,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PointDto } from '../../common/geojson.dto';

export class CreatePoiDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  safetyRating: number;

  @ValidateNested()
  @Type(() => PointDto)
  location: PointDto;

  @IsOptional()
  @IsBoolean()
  wheelchairAccessible?: boolean;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  /** Rendered as a link, so only absolute http(s) URLs are accepted. */
  @IsOptional()
  @ValidateIf((_, value) => value !== '')
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  openingHours?: string;
}
