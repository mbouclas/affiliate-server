import { Injectable } from '@nestjs/common';
import { ProductCategoryRedisModel } from "~root/product-category/product-category-redis-model";
import { toTree } from "~helpers/tree";
import { IGenericObject } from "~models/general";

@Injectable()
export class ProductCategoryService {
  constructor(protected clientId: string) {
  }

  async findOne(filters: IGenericObject) {
    return await new ProductCategoryRedisModel().findOne(filters);

  }
  async tree() {
    const categories = await new ProductCategoryRedisModel().find({ clientId: this.clientId });

    return toTree(categories.data as any);
  }
}
