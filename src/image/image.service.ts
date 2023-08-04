import { Injectable } from '@nestjs/common';
import { ImageRedisModel } from "~image/image-redis-model";
import { ProductService } from "~root/product/product.service";

@Injectable()
export class ImageService {
  async imagesFromUrls(urls: string[], productId: string, clientId: string) {
    const images = [];
    for (let url of urls) {
      const image = await new ImageRedisModel().convertStringToEntity(url, clientId);
      images.push(image);
    }

    return images;

/*    try {
      await new ProductService(clientId).update({ id: productId }, {images})
    }
    catch (e) {
      console.log(`Error saving images for product ${productId}`, e);
    }*/

  }
}
