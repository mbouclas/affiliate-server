import { Injectable } from '@nestjs/common';
import { HeroRedisModel, IHeroRedisModel } from "~cms/hero-redis-model";
import { FeaturedCategoriesModel } from "~cms/featuredCategoriesModel";
import { FeaturedItemsRedisModel } from "~cms/featured-items-redis-model.service";

export enum CmsKeys {
  HERO = 'hero',
  FEATURED_CATEGORIES = 'featuredCategories',
  FEATURED_ITEMS = 'featuredItems',
}

@Injectable()
export class CmsService {
  async storeHero(data: IHeroRedisModel, removePrevious = true) {
    const service = new HeroRedisModel();
    // delete all previous ones
    if (removePrevious) {
      const previous = await service.find({ clientId: data.clientId });
      await Promise.all(previous.data.map(async (item) => {
        await service.delete(item.id);
      }));
    }

    try {
      return await service.add(data);
    }
    catch (e) {
      throw Error(e);
    }
  }

  async updateHero(data: IHeroRedisModel) {
    try {
      return await new HeroRedisModel().update(data.id, data);
    }
    catch (e) {
      throw Error(e);
    }
  }

  async updateFeaturedCategories(clientId: string, data: string[]) {
    const service = new FeaturedCategoriesModel();
    const id = service.generateId({id: CmsKeys.FEATURED_CATEGORIES, clientId});

    const found = await service.getById(id);
    if (!found) {
      return await service.add({id, clientId, categories: data} as unknown as any);
    }

    try {
      return await service.update(id, { categories: data });
    }
    catch (e) {
      console.log(e)
      throw Error(e);
    }

  }

  async updateFeaturedItems(clientId: string, items: string[]) {
    const service = new FeaturedItemsRedisModel();
    const id = service.generateId({id: CmsKeys.FEATURED_ITEMS, clientId});

    const found = await service.getById(id);
    if (!found) {
      return await service.add({id, clientId, items} as unknown as any);
    }

    try {
      return await service.update(id, { items });
    }
    catch (e) {
      console.log(e)
      throw Error(e);
    }
  }
}
