import { Injectable } from "@nestjs/common";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { Entity, Schema } from "redis-om";
import { BaseRedisModel, ISearchableField } from "~shared/base-redis.model";

export interface ITagRedisModel {
  id: string;
  name: string;
  slug: string;
  clientId: string;
  createdAt: Date;
  updatedAt: Date;
}
@Injectable()
@McmsDi({
  id: 'TagRedisModel',
  type: 'service'
})
export class TagRedisModel extends BaseRedisModel {
  defaultSort = 'name';
  defaultWay: 'ASC' | 'DESC' = 'ASC'
  primaryKey = 'name';
  searchableFields: ISearchableField[] = [
    {
      name: "name",
      type: "text"
    },
    {
      name: "slug",
      type: "string"
    },
    {
      name: "clientId",
      type: "string"
    }
  ];
  schema() {
    return  new Schema('tag', {
      name: { type: 'text', sortable: true },
      slug: { type: 'string' },
      clientId: { type: 'string' },
      createdAt: { type: 'date', sortable: true },
      updatedAt: { type: 'date', sortable: true },
    });
  }

  async add(item: ITagRedisModel) {
    const repo = await this.getRepo();

    if (item.name && !item.slug) {
      item.slug = this.slugify(item.name);
    }

    if (!item.id) {
      item.id = this.generateId({
        title: item.name,
        clientId: item.clientId
      });
    }

    item.createdAt = new Date();
    item.updatedAt = new Date();

    try {
      return await repo.save(item.id, item as unknown as Entity)  as unknown as ITagRedisModel;
    }
    catch (e) {
      console.log(`Error saving ${item.id}`, e);
    }
  }


}
