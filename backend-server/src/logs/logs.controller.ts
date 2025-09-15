import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { LogsQueryDto } from './dto/logs-query.dto';
import { LogsService } from './logs.service';

@Controller()
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Post('ingest/logs')
  async ingestLogs(@Body() body: any) {
    return this.logsService.ingestLogs(body);
  }

  @Get('logs')
  async getLogs(@Query() query: LogsQueryDto) {
    return this.logsService.getLogs(query);
  }
}
