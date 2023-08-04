import { Entity, Repository, Schema } from "redis-om";
import { IGenericObject } from "~models/general";
import { extractSingleFilterFromObject } from "~helpers/data";
import { Injectable } from "@nestjs/common";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { SharedModule } from "~shared/shared.module";


export interface IProductRedisModel {
  id: string;
  links: string[];
}

@Injectable()
@McmsDi({
  id: 'ProductRedisModel',
  type: 'service'
})
export class ProductRedisModel {
  constructor(protected schemaName: string) {
  }

  productListSchema() {
    return  new Schema(this.schemaName, {
      id: { type: 'string' },
      links: { type: 'string[]' },
    });
  }


  async getRepo() {
    const repo = new Repository(this.productListSchema(), SharedModule.redisClient);
    await repo.createIndex();

    return repo;
  }

  async find(filter: IGenericObject) {
    const {key, value} = extractSingleFilterFromObject(filter);

    const repo = await this.getRepo();
    return await repo.search().where(key).eq(value).return.all() as unknown as IProductRedisModel[];
  }

  async findOne(filter: IGenericObject): Promise<IProductRedisModel> {
    const {key, value} = extractSingleFilterFromObject(filter);

    const repo = await this.getRepo();
    return await repo.search().where(key).eq(value).return.first() as unknown as IProductRedisModel;
  }

  async add(item: IProductRedisModel) {
    const repo = await this.getRepo();

    try {
      return await repo.save(item.id, item as unknown as Entity)  as unknown as IProductRedisModel;
    }
    catch (e) {
      console.log(`Error saving ${item.id}`, e);
    }
  }

  async remove(id: string, url: string) {
    const entry = await this.findOne({id});

    if (!entry) {
      return;
    }

    console.log(entry)

/*    const idx = entry.links.findIndex(l => l === url);
    if (idx === -1) {
      return;
    }




    try {
      await repo.delete(id);
    }
    catch (e) {
      console.log(`Error deleting ${id}`, e);
    }*/
  }
}
