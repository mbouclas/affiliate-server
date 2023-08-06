import { IGenericObject, IPagination } from "~models/general";
import { extractSingleFilterFromObject } from "~helpers/data";
import { Entity, Repository, Schema, Search } from "redis-om";
import { SharedModule } from "~shared/shared.module";
import { v4 } from "uuid";
import { ITagRedisModel } from "~tag/tag-redis.model";
const slug = require('slug');
const crypto = require('crypto');

export interface IBaseRedisModel {
  id: string;
}

export interface ISearchableField {
  name: string;
  type: 'text'|'string'|'number'|'date'|'boolean';
}

export class BaseRedisModel {
  protected defaultSort = 'createdAt';
  protected defaultWay: 'ASC'|'DESC' = 'DESC';
  protected primaryKey = 'id';
  searchableFields: ISearchableField[] = [

  ];

  generateId(params?: IGenericObject) {
    if (!params) {
      return v4();
    }
    const list: string[] = [];
    for (const key in params) {
      list.push(params[key]);
    }

    return crypto.createHash('md5').update(list.join('::')).digest("hex");
  }

  slugify(str: string) {
    return slug(str, {lower: true});
  }

  schema() {
    return  new Schema('test', {

    });
  }

  async getRepo() {
    const repo = new Repository(this.schema(), SharedModule.redisClient);
    await repo.createIndex();

    return repo;
  }

  async find(filters: IGenericObject, page = 1, limit = 20): Promise<IPagination<IBaseRedisModel>> {
    const offset = (page - 1) * limit;
    const repo = await this.getRepo();
    let s = this.buildQuery(filters, repo);

    // console.log(await s.return.count());
    const res = await s.return.page(offset, limit) as unknown as IBaseRedisModel[];
    return {
      data: res,
      page,
      limit,
      total: await this.count(filters),
      pages: Math.ceil(await this.count(filters) / limit),
      skip: offset,
    }
  }

  async findOne(filters: IGenericObject): Promise<IBaseRedisModel> {
    const repo = await this.getRepo();

    const s = this.buildQuery(filters, repo);

    return await s.return.first() as unknown as IBaseRedisModel;
  }

  buildQuery(filters: IGenericObject, repo: Repository) {
    const query = repo.search();

    for (const key in filters) {
      const field = this.searchableFields.find(f => f.name === key);
      if (!field) {
        continue;
      }

      if (field.type === 'text') {
        query.where(key).match(`*${filters[key]}*`);
        continue;
      }

      if (field.type === 'boolean') {
        query.where(key).eq(filters[key]);
        continue;
      }

      if (field.type === 'string') {
        query.where(key).eq(filters[key]);
        continue;
      }

      if (field.type === 'number') {
        query.where(key).eq(filters[key]);
        continue;
      }

      if (field.type === 'date') {
        query.where(key).eq(filters[key]);
      }

    }

    query.sortBy(filters.sort || this.defaultSort, filters.way || this.defaultWay);

    return query;
  }

  async count(filters: IGenericObject): Promise<number> {
    const repo = await this.getRepo();
    const s = this.buildQuery(filters, repo);


    return  await s.return.count();
  }



  async getById(id: string) {
    const repo = await this.getRepo();
    const res = await repo.fetch(id);

    return res[this.primaryKey] ? res : null;
  }

  async add(item: IBaseRedisModel, expiresInSeconds?: number) {
    const repo = await this.getRepo();

    try {
      return await repo.save(item.id, item as unknown as Entity)  as unknown as IBaseRedisModel;
    }
    catch (e) {
      console.log(`Error saving ${item.id}`, e);
    }
  }

  async delete(id: string) {
    const entry = await this.getById(id);

    if (!entry) {
      return;
    }

    const repo = await this.getRepo();
    try {
      return await repo.remove(id);
    }
    catch (e) {
      console.log(`Error deleting ${id}`, e);
    }

  }

  async update(id: string, data: IGenericObject) {
    const entity = await this.getById(id);
    for (const key in data) {
      entity[key] = data[key];
    }

    if (data['title']) {
      entity['slug'] = this.slugify(data['title']);
    }

    entity.updatedAt = new Date();

    const repo = await this.getRepo();

    try {
      return await repo.save(entity);
    }
    catch (e) {
      console.log(`Error updating ${id}`, e);
    }
  }
}
