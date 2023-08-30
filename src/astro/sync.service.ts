import { Injectable } from '@nestjs/common';
import { ProductService } from "~root/product/product.service";
import { ProductCategoryService } from "~root/product-category/product-category.service";
import { ProductCategoryRedisModel } from "~root/product-category/product-category-redis-model";
import { IBaseFlatTree, toTree } from "~helpers/tree";
import { TagRedisModel } from "~tag/tag-redis.model";
import { HeroRedisModel } from "~cms/hero-redis-model";
import { FeaturedCategoriesModel } from "~cms/featuredCategoriesModel";
import { FeaturedItemsRedisModel } from "~cms/featured-items-redis-model.service";

@Injectable()
export class SyncService {
  async getProducts(clientId: string) {
    const s = new ProductService(clientId);

    return await s.find({ limit: 1000, page: 1, queryParameters: {active: true} }, true);
  }

  async getCategories(clientId: string) {
    const s = new ProductCategoryRedisModel();
    const categories = await s.find({ clientId, limit: 1000, page: 1 });
    return toTree(categories.data as IBaseFlatTree[]);
  }

  async getTags(clientId: string) {
    const s = new TagRedisModel();
    const tags = await s.find({ clientId, limit: 1000, page: 1 });

    return tags.data;
  }

  async getHero(clientId: string) {
    const s = new HeroRedisModel();
    const hero = await s.find({ clientId, limit: 1000, page: 1 });

    return hero.data;
  }

  async getFeaturedCategories(clientId: string) {
    const s = new FeaturedCategoriesModel();
    const featuredCategories = await s.find({ clientId, limit: 1000, page: 1 });

    return featuredCategories.data[0]['categories'];
  }

  async getFeaturedItems(clientId: string) {
    const s = new FeaturedItemsRedisModel();
    const items = await s.find({ clientId, limit: 1000, page: 1 });

    return items.data[0]['items'];;
  }
}
