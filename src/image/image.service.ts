import { Injectable } from '@nestjs/common';
import { IImageRedisModel, ImageRedisModel } from "~image/image-redis-model";
import { ProductService } from "~root/product/product.service";
import { IBaseImageModel, IGenericObject, IPagination } from "~models/general";
import { CouldNotSaveImageToDbException } from "~image/could-not-save-image-to-db.exception";

@Injectable()
export class ImageService {
  public clientId: string;

  setClientId(clientId: string) {
    this.clientId = clientId;
    return this;
  }

  async find(filters: IGenericObject = {}, page = 1, limit = 20, withUsageCounts = false) {
    const res = await new ImageRedisModel().find(filters, page, limit) as IPagination<IBaseImageModel>;

    if (withUsageCounts) {
      for (const image of res.data) {
        image.usageCount = await this.getImageUsageCount(image.id, filters.clientId);
      }
    }

    return res;
  }

  async getImageUsageCount(id: string, clientId = this.clientId) {
    let total = 0;
    const thumbsRes = await new ProductService(clientId).find({queryParameters: { thumbCount: id}}, false, false);

    total = thumbsRes.total;

    const imagesRes = await new ProductService(clientId).find({queryParameters: { imageCount: id}}, false, false);

    total = total + imagesRes.total;

    return total;
  }

  async imagesFromUrls(urls: string[], productId: string, clientId: string) {
    const images = [];
    for (let url of urls) {
      const image = await new ImageRedisModel().convertStringToEntity(url, clientId);
      images.push(image);
    }

    return images;
  }

  async store(image: IImageRedisModel) {
    try {
      return await new ImageRedisModel().add(image);
    }
    catch (e) {
      throw new CouldNotSaveImageToDbException('COULD_NOT_SAVE_IMAGE_TO_DB', '1150', e);
    }
  }

  async delete(imageId: string, removeFromCloud = false) {

  }
}
