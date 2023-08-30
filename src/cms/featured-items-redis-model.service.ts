import { BaseRedisModel, ISearchableField } from "~shared/base-redis.model";
import { Schema } from "redis-om";
import { Injectable } from "@nestjs/common";
import { McmsDi } from "~helpers/mcms-component.decorator";

export interface IFeatureItemRedisModel  {
  id: string;
  title: string;
  caption: string;
  slug: string;
  itemId: string;
  itemType: string;
  parentId: string;
  clientId: string;
  metaData?: any;
  thumb?: any;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
@McmsDi({
  id: 'FeatureItemRedisModel',
  type: 'service'
})
export class FeaturedItemsRedisModel extends BaseRedisModel {
  defaultSort = 'id';
  defaultWay: 'ASC' | 'DESC' = 'ASC';
  searchableFields: ISearchableField[] = [

  ];

  schema() {
    return  new Schema('featuredItems', {
      id: { type: 'string' },
      items: { type: 'string[]' },
      clientId: { type: 'string' },
      metaData: { type: 'string', path: '$.metaData*' },
      thumb: { type: 'string', path: '$.thumb*' },
      createdAt: { type: 'date', sortable: true },
      updatedAt: { type: 'date', sortable: true },
    });
  }
}
