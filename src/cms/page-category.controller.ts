import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseInterceptors } from "@nestjs/common";
import { AppInterceptor } from "~shared/interceptors/app/app.interceptor";
import { Request } from "express";
import { PageCategoryRedisModel } from "~cms/models/page-category-redis.model";
import { PageCategoryService } from "~cms/page/page-category.service";


@Controller('api/page-category')
export class PageCategoryController {
  @Get()
  @UseInterceptors(AppInterceptor)
  async find(@Req() req: Request) {
    return await new PageCategoryService(req.header('x-app-name')).tree();
  }

  @Get(':id')
  @UseInterceptors(AppInterceptor)
  async findOne(@Req() req: Request, @Param('id') id: string) {
    return await new PageCategoryRedisModel().getById(id)
  }

  @Post()
  @UseInterceptors(AppInterceptor)
  async create(@Req() req: Request, @Body() data: any) {
    return await new PageCategoryRedisModel().add({ ...data, ...{clientId: req.header('x-app-name')} })
  }

  @Patch(':id')
  @UseInterceptors(AppInterceptor)
  async update(@Req() req: Request, @Param('id') id: string, @Body() data: any) {
    return await new PageCategoryRedisModel().update(id, data)
  }

  @Delete(':id')
  @UseInterceptors(AppInterceptor)
  async delete(@Req() req: Request, @Param('id') id: string) {
    return await new PageCategoryRedisModel().delete(id)
  }

  @Patch(':id/move')
  @UseInterceptors(AppInterceptor)
  async move(@Req() req: Request, @Body() data: {newParentId: string|null}, @Param('id') id: string) {
    return await new PageCategoryRedisModel().moveToParent(id, data.newParentId || null);
  }
}
