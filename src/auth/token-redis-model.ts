import { BaseRedisModel, ISearchableField } from "~shared/base-redis.model";
import { Entity, Schema } from "redis-om";


export interface ITokenRedisModel {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TokenRedisModel extends BaseRedisModel {
  searchableFields: ISearchableField[] = [
    { name: 'token', type: 'string' },
  ];
  schema() {
    return  new Schema('tokens', {
      id: { type: 'string' },
      userId: { type: 'string' },
      token: { type: 'string' },
      expiresAt: { type: 'date' },
      createdAt: { type: 'date', sortable: true },
      updatedAt: { type: 'date' },
    });
  }

  async add(item: Partial<ITokenRedisModel>, expiresInSeconds: number = 60 * 60 * 24 * 30) {
    const repo = await this.getRepo();

    if (!item.id) {
      item.id = item.token;
    }

    item.createdAt = new Date();
    item.updatedAt = new Date();

    try {
      const res = await repo.save(item.id, item as unknown as Entity)  as unknown as ITokenRedisModel;
      //convert 3 hours in seconds

      await repo.expire(item.id, expiresInSeconds);

      return res;
    }
    catch (e) {
      console.log(`Error saving ${item.id}`, e);
      throw new Error(`E 506: Error saving ${item.id}`);
    }
  }
}
