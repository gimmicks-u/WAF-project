import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DomainsService } from './domains.service';
import { CreateDomainDto } from './dto/create-domain.dto';
import { UpdateDomainDto } from './dto/update-domain.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/domains')
@UseGuards(JwtAuthGuard)
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req, @Body() createDomainDto: CreateDomainDto) {
    return this.domainsService.create(req.user.id, createDomainDto);
  }

  @Get()
  async findAll(@Request() req) {
    return this.domainsService.findAllByUser(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.domainsService.findOne(id, req.user.id);
  }

  @Get(':id/status')
  async getStatus(@Param('id') id: string, @Request() req) {
    return this.domainsService.getStatus(id, req.user.id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateDomainDto: UpdateDomainDto,
  ) {
    return this.domainsService.update(id, req.user.id, updateDomainDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Request() req) {
    await this.domainsService.remove(id, req.user.id);
  }
}
