import { Controller, Get, Query, Req } from "@nestjs/common";
import { Request } from "express";
import { ImageService } from "~image/image.service";

@Controller('api/image')
export class ImageController {
  @Get()
  async find(@Req() req: Request, @Query('q') qs: string, @Query('limit') limit = 10) {
    const queryParameters = Object.assign({active: true}, req.query);
    const page = req.query.page || 1 as any;
    const clientID = req.header('x-app-name');
    const service = new ImageService();
    queryParameters.clientId = clientID;

    return await service
      .find(queryParameters, page, limit, true);
  }
}
