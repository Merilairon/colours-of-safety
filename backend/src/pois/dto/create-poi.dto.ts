import { Type } from 'class-transformer';
import {
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
}
