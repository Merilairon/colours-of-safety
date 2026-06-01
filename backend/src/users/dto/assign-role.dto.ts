import { IsEnum } from 'class-validator';
import { UserRole } from '../user.entity';

export class AssignRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}
