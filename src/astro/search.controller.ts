import { Controller, Get, Query, Req, UseInterceptors } from "@nestjs/common";
import { AppInterceptor } from "~shared/interceptors/app/app.interceptor";
import {Request} from "express";
import { ProductService } from "~root/product/product.service";
import { QuickSearchResultsInterceptor } from "~root/astro/quick-search-results-interceptor.service";

@Controller('search')
export class SearchController {

  @Get()
  @UseInterceptors(AppInterceptor)
  async find(@Req() req: Request, @Query('q') qs: string, @Query('limit') limit = 10) {
    const queryParameters = Object.assign({}, req.query);
    const page = req.query.page || 1 as any;
    const clientID = req.header('x-app-name');
    const service = new ProductService(clientID);

    return await service
      .find({limit, page, queryParameters, q: qs}, true, false);
  }

  @Get('quick')
  @UseInterceptors(QuickSearchResultsInterceptor)
  @UseInterceptors(AppInterceptor)
  async quick(@Req() req: Request, @Query('q') qs: string, @Query('limit') limit = 10) {
    const queryParameters = Object.assign({}, req.query);
    const page = req.query.page || 1 as any;
    const clientID = req.header('x-app-name');
    const service = new ProductService(clientID);

    return await service
      .find({limit, page, queryParameters, q: qs}, true, false);
  }
}
