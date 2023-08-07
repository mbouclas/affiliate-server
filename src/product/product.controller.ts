import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Query, Req, UseInterceptors } from "@nestjs/common";
import { Request } from "express";
import { ProductService } from "~root/product/product.service";
import { AppInterceptor } from "~shared/interceptors/app/app.interceptor";
import { IsString } from "class-validator";

export class PostedProductDto {
  @IsString()
  title: string;

  clientId: string;
}

@Controller('api/product')
export class ProductController {

  @Get()
  @UseInterceptors(AppInterceptor)
  async find(@Req() req: Request, @Query('q') qs: string, @Query('limit') limit = 10) {
    const queryParameters = Object.assign({}, req.query);
    const page = req.query.page || 1 as any;
    const appName = req.header('x-app-name');

    return await new ProductService(appName).find({ limit, page, queryParameters, q: qs }, true);
  }

  @Post()
  @UseInterceptors(AppInterceptor)
  async store(@Req() req: Request, @Body() product: PostedProductDto) {
    const clientId = req.header('x-app-name');
    product.clientId = clientId;
    return await new ProductService(clientId).store(product);
  }

  @Get(':id')
  @UseInterceptors(AppInterceptor)
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const appName = req.header('x-app-name');

    return await new ProductService(appName).findOne({ id });
  }

  @Patch(':id')
  @UseInterceptors(AppInterceptor)
  async update(@Param('id') id: string, @Req() req: Request, @Body() product: any) {
    const appName = req.header('x-app-name');

    return await new ProductService(appName).update({ id }, product);
  }

  @Delete(':id')
  @UseInterceptors(AppInterceptor)
  async delete(@Param('id') id: string, @Req() req: Request) {
    const appName = req.header('x-app-name');

    return await new ProductService(appName).delete({ id });
  }

  @Patch(':id/change-thumb')
  @UseInterceptors(AppInterceptor)
  async changeThumb(@Param('id') id: string, @Req() req: Request, @Body() body: {imageId: string}) {
    const appName = req.header('x-app-name');

    return await new ProductService(appName).changeThumb(id, body.imageId);
  }
}
