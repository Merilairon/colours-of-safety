import { IsIn, IsObject, IsUUID } from 'class-validator';

export class CreateEditProposalDto {
  @IsIn(['poi', 'district'])
  targetType: 'poi' | 'district';

  @IsUUID()
  targetId: string;

  @IsObject()
  proposedData: object;
}
