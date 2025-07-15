import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { EducationalSubdivisionService } from '../services/educational-subdivision.service';
import { CreateEducationalSubdivisionDto, UpdateEducationalSubdivisionDto } from '../dto/educational-subdivision.dto';

@Controller('educational-subdivisions')
export class EducationalSubdivisionController {
  constructor(private readonly educationalSubdivisionService: EducationalSubdivisionService) {}

  @Post()
  create(@Body() createEducationalSubdivisionDto: CreateEducationalSubdivisionDto) {
    return this.educationalSubdivisionService.create(createEducationalSubdivisionDto);
  }

  @Get()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('filter') filter?: string,
    @Query('sort') sort?: string
  ) {
    return this.educationalSubdivisionService.findAll(page, limit, filter, sort);
  }

  @Get('by-stage/:stageId/pwa-list')
  findActiveByStage(@Param('stageId') stageId: string) {
    return this.educationalSubdivisionService.findActiveSubdivisionsByStage(+stageId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.educationalSubdivisionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEducationalSubdivisionDto: UpdateEducationalSubdivisionDto) {
    return this.educationalSubdivisionService.update(+id, updateEducationalSubdivisionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.educationalSubdivisionService.remove(+id);
  }
}