import { Injectable } from '@nestjs/common';
import { IUserRedisModel, UserRedisModel } from "~user/user-redis-model";
import { IGenericObject } from "~models/general";
import { AuthService } from "~root/auth/auth.service";

@Injectable()
export class UserService {
  protected model: UserRedisModel;

  constructor() {
    this.model = new UserRedisModel();
  }

  async find(filters: IGenericObject, limit = 10) {

  }

  async findOne(filters: IGenericObject) {
    const found = await this.model.findOne(filters) as IUserRedisModel;
    if (!found) {
      throw new Error('User not found');
    }

    return found;
  }

  async store(user: Partial<IUserRedisModel>) {
    try {
      return await this.model.add(user);
    }
    catch (e) {
      throw e;
    }
  }

  async update(id: string, user: Partial<IUserRedisModel>) {

  }

  async delete(id: string) {

  }
}
