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
export class FeatureItemRedisModel extends BaseRedisModel {
  defaultSort = 'title';
  defaultWay: 'ASC' | 'DESC' = 'ASC';
  searchableFields: ISearchableField[] = [
    {
      name: 'title',
      type: 'text'
    },
    ];

  schema() {
    return  new Schema('featuredItem', {
      title: { type: 'text', sortable: true },
      caption: { type: 'string' },
      slug: { type: 'string' },
      itemId: { type: 'string' },
      itemType: { type: 'string' },
      parentId: { type: 'string' },
      clientId: { type: 'string' },
      metaData: {type: 'string', path:'$.metaData*'},
      thumb: {type: 'string', path:'$.thumb*'},
      createdAt: { type: 'date', sortable: true },
      updatedAt: { type: 'date', sortable: true },
    });
  }
}
