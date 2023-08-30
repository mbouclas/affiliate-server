import { Controller, Get, UseInterceptors, Req } from "@nestjs/common";
import { AstroAuthorizationInterceptor } from "~root/astro/astro-authorization.interceptor";
import { SyncService } from "~root/astro/sync.service";
import { AppInterceptor } from "~shared/interceptors/app/app.interceptor";
import { Request } from "express";

@Controller('astro/sync')
export class SyncController {
  @Get()
  @UseInterceptors(AstroAuthorizationInterceptor)
  @UseInterceptors(AppInterceptor)
  async sync(@Req() req: Request) {
    const clientId = req.header('x-app-name');
    const service = new SyncService();
    return {
      products: await service.getProducts(clientId),
      categories: await service.getCategories(clientId),
      tags: await service.getTags(clientId),
      hero: await service.getHero(clientId),
      featuredCategories: await service.getFeaturedCategories(clientId),
      featuredItems: await service.getFeaturedItems(clientId),
    }
  }
}
