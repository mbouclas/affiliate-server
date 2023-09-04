import { Injectable } from '@nestjs/common';
import { IGenericObject, ITagModel } from "~models/general";
import { TagRedisModel } from "~tag/tag-redis.model";

@Injectable()
export class TagService {
  static async findOne(filters: IGenericObject): Promise<ITagModel> {
    const found = await new TagRedisModel().findOne(filters) as unknown as ITagModel;
    if (!found) {
      return null;
    }

    return found;
  }
}
