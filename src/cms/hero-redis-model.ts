import { BaseRedisModel, ISearchableField } from "~shared/base-redis.model";
import { Entity, Schema } from "redis-om";
import { IBaseImageModel } from "~models/general";

export interface IHeroRedisModel {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  caption: string;
  clientId: string;
  metaData?: any;
  image?: IBaseImageModel;
  createdAt: Date;
  updatedAt: Date;
}

export class HeroRedisModel extends BaseRedisModel {
  defaultSort = 'title';
  defaultWay: 'ASC' | 'DESC' = 'ASC';
  searchableFields: ISearchableField[] = [
    {
      name: "title",
      type: "text"
    }
  ];

  schema() {
    return new Schema('HeroSection', {
      title: { type: 'text', sortable: true },
      slug: { type: 'string' },
      subtitle: { type: 'string' },
      caption: { type: 'string' },
      clientId: { type: 'string' },
      metaData: { type: 'string', path: '$.metaData*' },
      image: { type: 'string', path: '$.thumb*' },
      createdAt: { type: 'date', sortable: true },
      updatedAt: { type: 'date', sortable: true },
    });
  }

  async add(item: IHeroRedisModel) {
    const repo = await this.getRepo();

    if (!item.id) {
      item.id = this.generateId({
        title: item.title,
        clientId: item.clientId
      });
    }

    item.createdAt = new Date();
    item.updatedAt = new Date();


    try {
      return await repo.save(item.id, item as unknown as Entity)  as unknown as IHeroRedisModel;
    }
    catch (e) {
      console.log(`Error saving ${item.id}`, e);
    }
  }
}
