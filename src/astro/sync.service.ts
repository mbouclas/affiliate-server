import { Injectable } from '@nestjs/common';
import { ProductService } from "~root/product/product.service";
import { ProductCategoryService } from "~root/product-category/product-category.service";
import { ProductCategoryRedisModel } from "~root/product-category/product-category-redis-model";
import { IBaseFlatTree, toTree } from "~helpers/tree";
import { TagRedisModel } from "~tag/tag-redis.model";

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
}
