import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Pool } from 'pg';
import { PG_CONNECTION } from '../database/database.module';

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name);

  constructor(@Inject(PG_CONNECTION) private pool: Pool) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldLogs() {
    this.logger.log('Starting daily log cleanup...');

    try {
      const result = await this.pool.query(
        `DELETE FROM logs WHERE ts < NOW() - INTERVAL '7 days'`,
      );
      this.logger.log(`Deleted ${result.rowCount} old log entries`);
    } catch (error) {
      this.logger.error('Failed to cleanup old logs', error);
    }
  }
}
