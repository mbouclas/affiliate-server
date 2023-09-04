import { IBaseImageModel, IGenericObject } from "~models/general";
import { Injectable } from "@nestjs/common";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { BaseRedisModel } from "~shared/base-redis.model";
import { Entity, Schema } from "redis-om";
import { IBaseCategoryModel } from "~helpers/tree";

export interface IPageCategoryRedisModel  {
  id: string;
  title: string;
  slug: string;
  clientId: string;
  metaData?: IGenericObject;
  thumb?: IBaseImageModel;
  parentId: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
@McmsDi({
  id: 'PageCategoryRedisModel',
  type: 'service'
})
export class PageCategoryRedisModel extends BaseRedisModel {
  defaultSort = 'title';
  defaultWay: 'ASC' | 'DESC' = 'ASC'

  schema() {
    return  new Schema('pageCategory', {
      title: { type: 'text', sortable: true },
      slug: { type: 'string' },
      parentId: { type: 'string' },
      clientId: { type: 'string' },
      metaData: {type: 'string', path:'$.metaData*'},
      thumb: {type: 'string', path:'$.thumb*'},
      createdAt: { type: 'date', sortable: true },
      updatedAt: { type: 'date', sortable: true },
    });
  }

  async add(item: IPageCategoryRedisModel) {
    const repo = await this.getRepo();
    if (item.title && !item.slug) {
      item.slug = this.slugify(item.title);
    }

    if (!item.id) {
      item.id = this.generateId({
        title: item.title,
        clientId: item.clientId
      });
    }

    item.createdAt = new Date();
    item.updatedAt = new Date();

    try {
      return await repo.save(item.id, item as unknown as Entity)  as unknown as IPageCategoryRedisModel;
    }
    catch (e) {
      console.log(`Error saving ${item.id}`, e);
    }
  }

  async addCategoriesToDb(clientId: string, categories: IBaseCategoryModel[], parentId: string | null = null)  {
    for (const category of categories) {
      // try to find the category
      const existingCategory = await this.getById(category.id);
      if (!existingCategory) {
        await this.add({
          id: category.id,
          slug: category.slug,
          title: category.title,
          clientId,
          parentId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }


      if (category.children) {
        await this.addCategoriesToDb(clientId, category.children, category.id);
      }
    }
  }

  async moveToParent(id: string, parentId: string | null) {
    const category = await this.getById(id);
    if (!category) {
      return;
    }

    category.parentId = parentId;

    category.parentId = parentId;
    return await this.update(id, category);
  }
}
