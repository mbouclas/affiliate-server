import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseInterceptors } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { ProductCategoryService } from "~root/product-category/product-category.service";
import { AppInterceptor } from "~shared/interceptors/app/app.interceptor";
import { Request } from "express";
import { ProductCategoryRedisModel } from "~root/product-category/product-category-redis-model";


@Controller('api/product-category')
export class ProductCategoryController {


  @Get()
  @UseInterceptors(AppInterceptor)
  async find(@Req() req: Request) {
    return await new ProductCategoryService(req.header('x-app-name')).tree();
  }

  @Get(':id')
  @UseInterceptors(AppInterceptor)
  async findOne(@Req() req: Request, @Param('id') id: string) {
    return await new ProductCategoryRedisModel().getById(id)
  }

  @Post()
  @UseInterceptors(AppInterceptor)
  async create(@Req() req: Request, @Body() data: any) {
    return await new ProductCategoryRedisModel().add({ ...data, ...{clientId: req.header('x-app-name')} })
  }

  @Patch(':id')
  @UseInterceptors(AppInterceptor)
  async update(@Req() req: Request, @Param('id') id: string, @Body() data: any) {
    return await new ProductCategoryRedisModel().update(id, data)
  }

  @Delete(':id')
  @UseInterceptors(AppInterceptor)
  async delete(@Req() req: Request, @Param('id') id: string) {
    return await new ProductCategoryRedisModel().delete(id)
  }

  @Patch(':id/move')
  @UseInterceptors(AppInterceptor)
  async move(@Req() req: Request, @Body() data: {newParentId: string|null}, @Param('id') id: string) {
    return await new ProductCategoryRedisModel().moveToParent(id, data.newParentId || null);
  }
}
