import { BaseRedisModel } from "~shared/base-redis.model";
import { Injectable } from "@nestjs/common";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { Entity, Schema } from "redis-om";
import { CloudinaryService } from "~shared/providers/cloudinary.service";
import { ClientService } from "~root/client/client.service";
import { UploadApiResponse } from "cloudinary";


export interface IImageRedisModel {
  id: string;
  cloudinaryId: string;
  url: string;
  originalUrl: string;
  clientId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
@McmsDi({
  id: 'ImageRedisModel',
  type: 'service'
})

export class ImageRedisModel extends BaseRedisModel {
  defaultSort = 'createdAt';
  defaultWay: 'ASC' | 'DESC' = 'DESC';


  schema() {
    return  new Schema('image', {
      id: { type: 'string'},
      url: { type: 'string' },
      originalUrl: { type: 'string' },
      cloudinaryId: { type: 'string' },
      clientId: { type: 'string' },
      createdAt: { type: 'date', sortable: true },
      updatedAt: { type: 'date', sortable: true },
    });
  }

  async add(item: IImageRedisModel) {
    const repo = await this.getRepo();

    if (!item.id) {
      item.id = this.generateId({
        url: item.url,
        clientId: item.clientId
      });
    }

    item.createdAt = new Date();
    item.updatedAt = new Date();

    try {
      return await repo.save(item.id, item as unknown as Entity)  as unknown as IImageRedisModel;
    }
    catch (e) {
      console.log(`Error saving ${item.id}`, e);
    }
  }

  async convertStringToEntity(url: string, clientId: string) {
    const id = this.generateId({
      clientId,
      url
    });

    // look up for this image in redis
    const exists = await this.getById(id);
    if (exists) {
      return exists;
    }

    // upload it to cloudinary
    const service = new CloudinaryService();
    const cloudinaryConfig = ClientService.getConfigProperty(clientId, 'images.cloudinary');
    service.setConfig(cloudinaryConfig);
    let res: UploadApiResponse;
    const tags = [];

    if (process.env.ENV !== 'production') {
      tags.push('dev');
    }

    try {
      res = await service.upload(url, id, undefined,  {
        folder: process.env.ENV === 'production' ? cloudinaryConfig.folder : `${cloudinaryConfig.folder}/dev`,
        cloudinaryMetaData: {
          tags,
        }
      } as any);
    }
    catch (e) {
      console.log('Error uploading image to cloudinary 506',e)
      throw Error(e);
    }


    try {
      return await this.add({
        id,
        clientId,
        url: res.secure_url,
        cloudinaryId: res.public_id,
        originalUrl: url,
      });
    }
    catch (e) {
      console.log('Error saving image to redis 516',e);
    }

  }
}
