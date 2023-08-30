import { Body, Controller, Get, Post, Req, UseInterceptors } from "@nestjs/common";
import { AppInterceptor } from "~shared/interceptors/app/app.interceptor";
import { Request } from "express";
import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { IImageRedisModel } from "~image/image-redis-model";
import { HeroRedisModel, IHeroRedisModel } from "~cms/hero-redis-model";
import { CmsService } from "~cms/cms.service";
import { FeaturedCategoriesModel } from "~cms/featuredCategoriesModel";

class FeaturedCategoriesDto {
  @IsNotEmpty()
  categories: string[];

}

class FeaturedItemsDto {
  @IsNotEmpty()
  items: string[];
}

class HeroDto {
  @IsOptional()
  id: string;

  @IsString()
  title: string;

  @IsString()
  subtitle: string;

  @IsOptional()
  image: IImageRedisModel;

  @IsOptional()
  slug: string;
}

@Controller('api/cms')
export class CmsController {

  @Get('hero')
  @UseInterceptors(AppInterceptor)
  async getHero(@Req() req: Request) {
    const clientId = req.header('x-app-name');
    return await new HeroRedisModel().find({ clientId });
  }

  @Get('featured-categories')
  @UseInterceptors(AppInterceptor)
  async getFeaturedCategories(@Req() req: Request) {
    const clientId = req.header('x-app-name');
    const found = await new FeaturedCategoriesModel().find({ clientId });

    return found.data[0]['categories'];
  }

  @Get('featured-items')
  @UseInterceptors(AppInterceptor)
  async getFeaturedItems(@Req() req: Request) {
    const clientId = req.header('x-app-name');
  }

  @Post('featured-categories')
  @UseInterceptors(AppInterceptor)
  async storeFeaturedCategories(@Req() req: Request, @Body() categories: FeaturedCategoriesDto) {
    const clientId = req.header('x-app-name');
    try {
      return await new CmsService().updateFeaturedCategories(clientId, categories.categories);
    }
    catch (e) {
      throw Error(e);
    }
  }

  @Post('featured-items')
  @UseInterceptors(AppInterceptor)
  async storeFeaturedItems(@Req() req: Request, @Body() data: FeaturedItemsDto) {
    const clientId = req.header('x-app-name');
    try {
      return await new CmsService().updateFeaturedItems(clientId, data.items);
    }
    catch (e) {
      throw Error(e);
    }
  }

  @Post('hero')
  @UseInterceptors(AppInterceptor)
  async storeHero(@Req() req: Request, @Body() hero: HeroDto) {
    const clientId = req.header('x-app-name');
    if (hero.id) {
      return await new CmsService().updateHero(hero as unknown as IHeroRedisModel);
    }

    try {
      return await new CmsService().storeHero({...hero, ...{clientId}} as unknown as IHeroRedisModel);
    }
    catch (e) {
      throw Error(e);
    }
  }
}
