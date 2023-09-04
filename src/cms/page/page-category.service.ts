import { Injectable } from '@nestjs/common';
import { IGenericObject } from "~models/general";
import { toTree } from "~helpers/tree";
import { PageCategoryRedisModel } from "~cms/models/page-category-redis.model";

@Injectable()
export class PageCategoryService {
  constructor(protected clientId: string) {
  }

  async findOne(filters: IGenericObject) {
    return await new PageCategoryRedisModel().findOne(filters);

  }
  async tree() {
    const categories = await new PageCategoryRedisModel().find({ clientId: this.clientId });

    return toTree(categories.data as any);
  }
}
