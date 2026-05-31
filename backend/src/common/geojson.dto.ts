import {
  ArrayMaxSize,
  ArrayMinSize,
  Equals,
  IsArray,
  IsNumber,
} from 'class-validator';

export class PointDto {
  @Equals('Point')
  type: 'Point';

  /** [longitude, latitude] */
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  coordinates: [number, number];
}

export class PolygonDto {
  @Equals('Polygon')
  type: 'Polygon';

  /** Array of linear rings; each ring is an array of [lng, lat] positions. */
  @IsArray()
  @ArrayMinSize(1)
  coordinates: number[][][];
}
