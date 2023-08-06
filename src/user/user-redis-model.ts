import { BaseRedisModel, ISearchableField } from "~shared/base-redis.model";
import { Injectable } from "@nestjs/common";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { IBaseImageModel, IGenericObject } from "~models/general";
import { Entity, Schema } from "redis-om";
import { AuthService } from "~root/auth/auth.service";
import { ISite } from "~root/client/client.service";


export interface IUserRedisModel  {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  active?: boolean;
  password?: string;
  confirmToken?: string;
  forgotPasswordToken?: string;
  type: 'user' | 'guest' | 'editor' | 'admin';
  clientId: string;
  metaData?: IGenericObject;
  thumb?: IBaseImageModel;
  createdAt?: Date;
  updatedAt?: Date;
  allowedSites?: ISite[];
}

@Injectable()
@McmsDi({
  id: 'UserRedisModel',
  type: 'service'
})
export class UserRedisModel extends BaseRedisModel {
  defaultSort = 'createdAt';
  defaultWay: 'ASC' | 'DESC' = 'DESC';
  searchableFields: ISearchableField[] = [
    {
      name: 'firstName',
      type: 'text'
    },
    {
      name: 'lastName',
      type: 'text'
    },
    {
      name: 'email',
      type: 'text'
    },
    {
      name: 'active',
      type: 'boolean'
    }
  ];

  schema() {
    return  new Schema('user', {
      firstName: { type: 'text', sortable: true },
      lastName: { type: 'text', sortable: true },
      email: { type: 'text', sortable: true },
      active: { type: 'boolean' },
      password: { type: 'string' },
      type: { type: 'string' },
      confirmToken: { type: 'string' },
      forgotPasswordToken: { type: 'string' },
      clientId: { type: 'string' },
      metaData: {type: 'string', path:'$.metaData*'},
      thumb: {type: 'string', path:'$.thumb*'},
      createdAt: { type: 'date', sortable: true },
      updatedAt: { type: 'date', sortable: true },
    });
  }

  async add(item: Partial<IUserRedisModel>) {
    const repo = await this.getRepo();

    if (!item.id) {
      item.id = this.generateId({
        email: item.email,
      });
    }

    // check if the user is there
    const exists = await this.findOne({email: item.email});

    if (exists) {
      return AuthService.sanitizeUserModel(exists as IUserRedisModel);
    }

    if (!item.clientId) {
      item.clientId = '*';
    }

    if (!item.active) {
      item.active = false;
    }

    item.password = await (new AuthService).hasher.hashPassword(item.password);

    item.createdAt = new Date();
    item.updatedAt = new Date();

    try {
      const res = await repo.save(item.id, item as unknown as Entity)  as unknown as IUserRedisModel;
      return AuthService.sanitizeUserModel(res as IUserRedisModel);
    }
    catch (e) {
      console.log(`Error saving ${item.id}`, e);
      throw new Error(`E 506: Error saving ${item.id}`);
    }
  }
}
