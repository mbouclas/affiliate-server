import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseInterceptors } from "@nestjs/common";
import { AppInterceptor } from "~shared/interceptors/app/app.interceptor";
import { Request } from "express";
import { IsString } from "class-validator";
import { PageService } from "~cms/page/page.service";
export class PostedPageDto {
  @IsString()
  title: string;

  clientId: string;
}


@Controller('api/page')
export class PageController {
  @Get()
  @UseInterceptors(AppInterceptor)
  async find(@Req() req: Request, @Query('q') qs: string, @Query('limit') limit = 10) {
    const queryParameters = Object.assign({}, req.query);
    const page = req.query.page || 1 as any;
    const appName = req.header('x-app-name');

    return await new PageService(appName).find({ limit, page, queryParameters, q: qs }, true);
  }

  @Get('quick')
  @UseInterceptors(AppInterceptor)
  async quickSearch(@Req() req: Request, @Query('q') qs: string, @Query('limit') limit = 10) {
    const page = req.query.page || 1 as any;
    const appName = req.header('x-app-name');
    return await new PageService(appName).find({ limit, page, queryParameters: {}, q: qs }, true);
  }

  @Post()
  @UseInterceptors(AppInterceptor)
  async store(@Req() req: Request, @Body() page: PostedPageDto) {
    const clientId = req.header('x-app-name');
    page.clientId = clientId;
    return await new PageService(clientId).store(page);
  }

  @Get(':id')
  @UseInterceptors(AppInterceptor)
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const appName = req.header('x-app-name');

    return await new PageService(appName).findOne({ id });
  }

  @Patch(':id')
  @UseInterceptors(AppInterceptor)
  async update(@Param('id') id: string, @Req() req: Request, @Body() page: any) {
    const appName = req.header('x-app-name');

    return await new PageService(appName).update({ id }, page);
  }

  @Delete(':id')
  @UseInterceptors(AppInterceptor)
  async delete(@Param('id') id: string, @Req() req: Request) {
    const appName = req.header('x-app-name');

    return await new PageService(appName).delete({ id });
  }

  @Patch(':id/change-thumb')
  @UseInterceptors(AppInterceptor)
  async changeThumb(@Param('id') id: string, @Req() req: Request, @Body() body: {imageId: string}) {
    const appName = req.header('x-app-name');

    return await new PageService(appName).changeThumb(id, body.imageId);
  }
}
