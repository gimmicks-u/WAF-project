import { Controller, Post, Body, Get, Query, UseGuards, Request } from '@nestjs/common';
import { LogsQueryDto } from './dto/logs-query.dto';
import { LogsService } from './logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Post('ingest/logs')
  async ingestLogs(@Body() body: any) {
    return this.logsService.ingestLogs(body);
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard)
  async getLogs(@Query() query: LogsQueryDto, @Request() req) {
    return this.logsService.getLogs(query, req.user.id);
  }
}
