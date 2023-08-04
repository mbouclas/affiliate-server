import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseInterceptors } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { ITagRedisModel, TagRedisModel } from "~tag/tag-redis.model";
import { AppInterceptor } from "~shared/interceptors/app/app.interceptor";
import { Request } from "express";
import { IsString, IsNotEmpty } from "class-validator";

class PostedTagDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

@Controller('api/tag')
export class TagController {

  @Get()
  @UseInterceptors(AppInterceptor)
  async find(@Req() req: Request, @Query('q') qs: string, @Query('limit') limit = 10) {
    const queryParameters = Object.assign({}, req.query);
    queryParameters.clientId = req.header('x-app-name');
    const page = req.query.page || 1 as any;

    return await new TagRedisModel().find(queryParameters, page, limit);
  }

  @Post()
  @UseInterceptors(AppInterceptor)
  async add(@Req() req: Request, @Body() data: PostedTagDto) {
    const clientId = req.header('x-app-name');
    const s = new TagRedisModel();
    return await new TagRedisModel().add({
      id: s.generateId({clientId, name: data.name}),
      name: data.name,
      slug: s.slugify(data.name),
      clientId,
    } as ITagRedisModel);
  }

  @Patch(':id')
  @UseInterceptors(AppInterceptor)
  async update(@Req() req: Request, @Param('id') id: string, @Body() data: PostedTagDto) {
    const s = new TagRedisModel();
    return await s.update(id, {
      name: data.name,
      slug: s.slugify(data.name),
    });
  }

  @Delete(':id')
  @UseInterceptors(AppInterceptor)
  async delete(@Req() req: Request, @Param('id') id: string) {

    return await new TagRedisModel().delete(id);
  }
}
