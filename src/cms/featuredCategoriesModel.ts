import { BaseRedisModel, ISearchableField } from "~shared/base-redis.model";
import { Injectable } from "@nestjs/common";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { Schema } from "redis-om";

@Injectable()
@McmsDi({
  id: 'FeaturedCategoriesModel',
  type: 'service'
})
export class FeaturedCategoriesModel extends BaseRedisModel {
    defaultSort = 'id';
    defaultWay: 'ASC' | 'DESC' = 'ASC';
    searchableFields: ISearchableField[] = [

    ];

    schema() {
        return new Schema('featuredCategories', {
            id: { type: 'string' },
            categories: { type: 'string[]' },
            clientId: { type: 'string' },
            metaData: { type: 'string', path: '$.metaData*' },
            thumb: { type: 'string', path: '$.thumb*' },
            createdAt: { type: 'date', sortable: true },
            updatedAt: { type: 'date', sortable: true },
        });
    }
}
