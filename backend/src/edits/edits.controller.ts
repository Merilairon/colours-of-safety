import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/jwt-payload.interface';
import {
  PublicEditProposal,
  serializeEditProposal,
} from '../common/public-serializer';
import { ReviewDto } from '../common/review.dto';
import { UserRole } from '../users/user.entity';
import { CreateEditProposalDto } from './dto/create-edit-proposal.dto';
import { EditsService } from './edits.service';

@Controller('edits')
export class EditsController {
  constructor(private readonly edits: EditsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async create(
    @Body() dto: CreateEditProposalDto,
    @CurrentUser() user: AuthUser,
  ): Promise<PublicEditProposal> {
    return serializeEditProposal(await this.edits.create(dto, user.id));
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.REVIEWER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findPending(): Promise<PublicEditProposal[]> {
    return (await this.edits.findPending()).map(serializeEditProposal);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  async findMine(@CurrentUser() user: AuthUser): Promise<PublicEditProposal[]> {
    return (await this.edits.findMine(user.id)).map(serializeEditProposal);
  }

  @Patch(':id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.REVIEWER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewDto,
    @CurrentUser() user: AuthUser,
  ): Promise<PublicEditProposal> {
    return serializeEditProposal(await this.edits.review(id, dto, user.id));
  }
}
