import {
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
  Req,
  Get,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/jwt-payload.interface';
import { VotesService } from './votes.service';

interface VoteResponse {
  success: boolean;
  voteCount: number;
  autoApproved: boolean;
}

@Controller()
export class VotesController {
  constructor(private readonly votes: VotesService) {}

  @Post('pois/:id/vote')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async votePoi(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ): Promise<VoteResponse> {
    const ip = this.extractIp(req);
    const result = await this.votes.voteOnPoi(id, user.id, ip);
    return {
      success: result.success,
      voteCount: result.voteCount,
      autoApproved: result.autoApproved ?? false,
    };
  }

  @Post('districts/:id/vote')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async voteDistrict(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ): Promise<VoteResponse> {
    const ip = this.extractIp(req);
    const result = await this.votes.voteOnDistrict(id, user.id, ip);
    return {
      success: result.success,
      voteCount: result.voteCount,
      autoApproved: result.autoApproved ?? false,
    };
  }

  @Get('pois/:id/voted')
  @UseGuards(JwtAuthGuard)
  async hasVotedPoi(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ): Promise<{ voted: boolean }> {
    const ip = this.extractIp(req);
    const voted = await this.votes.hasVoted(id, 'poi', user.id, ip);
    return { voted };
  }

  @Get('districts/:id/voted')
  @UseGuards(JwtAuthGuard)
  async hasVotedDistrict(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ): Promise<{ voted: boolean }> {
    const ip = this.extractIp(req);
    const voted = await this.votes.hasVoted(id, 'district', user.id, ip);
    return { voted };
  }

  private extractIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded
      ? (typeof forwarded === 'string' ? forwarded : forwarded[0])
          .split(',')[0]
          .trim()
      : req.socket.remoteAddress || 'unknown';
    return ip;
  }
}
