import { Injectable } from "@nestjs/common";
import { IScraperJobPayload } from "~scrapers/base-scraper.service";
import { throttleAsyncRequests } from "~helpers/requests";
import { IClientConfig } from "~root/client/models/client.model";
import { store } from "~root/state";
import { ClientService } from "~root/client/client.service";
const crypto = require('crypto');
import { v4 } from 'uuid';
import { ScrapersModule } from "~scrapers/scrapers.module";
import { SharedModule } from "~shared/shared.module";
import { ElasticSearchService } from "~es/elastic-search.service";
import { ProductService } from "~root/product/product.service";
import slug from "slug";
import { ImageService } from "~image/image.service";
import { ProductCategoryRedisModel } from "~root/product-category/product-category-redis-model";
import { createNestedTree, flattenTree, IBaseCategoryModel } from "~helpers/tree";
import { IGenericObject } from "~models/general";
import { IImageRedisModel } from "~image/image-redis-model";

export enum ExternalScraperEvents {
  SCRAPE = 'scrape',
  SCRAPE_ERROR = 'scrape_error',
  SCRAPE_SUCCESS = 'scrape_success',
  SCRAPE_FAILED = 'scrape_failed',
  SCRAPE_ADDED_TO_LIST = 'scrape_added_to_list',
  SCRAPE_REMOVED_FROM_LIST = 'scrape_removed_from_list',
}

@Injectable()
export class BaseExternalScraperService {
  protected requests = [];
  protected timeout = 30000;
  protected config;
  protected client: IClientConfig;

  setConfig(config: any) {
    this.config = config;
  }

  init(clientId: string) {
    this.config = store.getState().configs["scrapers"];
    this.client = (new ClientService()).getClient(clientId);
    return this;
  }

  async scrape(item: IScraperJobPayload) {
    const product = {};


    ScrapersModule.logger.log(`Processed ${item.url}`);
    SharedModule.eventEmitter.emit(ExternalScraperEvents.SCRAPE_SUCCESS, product);
  }

  async processUrls(urls: IScraperJobPayload[]) {
    for (let link of urls) {
      this.requests.push(this.scrape.bind(this, link));
    }

    try {
      await throttleAsyncRequests(this.requests, 3000);
    }
    catch (e) {
      console.log(`Error scraping ${e.message}`, e);
    }
  }

  static createUniqueDocId(clientId: string, url: string) {
    return crypto.createHash('md5').update(`${clientId}:${url.trim()}`).digest("hex");
  }

  async saveToElasticSearch(product) {
    const es = ElasticSearchService.newInstance();
    const exists = await es.indexExists(this.client.elasticSearch.index);

    if (!exists) {
      await this.createElasticSearchIndex(es);
    }

    const existingDoc = await (new ProductService(this.client.id)).findOne({id: product.id});

    if (!existingDoc) {
      product.firstTime = true;
    }

    if (!product.variants || !Array.isArray(product.variants)) {
      product.variants = [];
    }

    product.variants = product.variants.map(variant => {
      if (typeof variant !== "string") {
        return variant;
      }

      return {
        title: variant,
        slug: slug(variant, { lower: true }),
      }
    });

    if (existingDoc) {
      await (new ProductService(this.client.id)).update({id: product.id}, this.cleanUpProductForUpdate(product));
      ScrapersModule.logger.log(`Synced ${product.slug} with ES`);
      return;
    }

    try {
      await (new ProductService(this.client.id)).store(product);
    }
    catch (e) {
      console.log(`Error storing ${product.slug} in ES`, e);
    }


    ScrapersModule.logger.log(`Synced ${product.slug} with ES`);
  }

  protected async processImages(product: any) {
    if (!Array.isArray(product.images)) {
      return [];
    }

    product.images = await new ImageService().imagesFromUrls(product.images.map((image) => typeof image === 'string' ? image : image.url), product.id, this.client.id);

    return product;
  }

  protected async processThumb(thumb: string|IGenericObject, productId: string): Promise<IImageRedisModel> {
    if (typeof thumb === 'string') {
      const res = await new ImageService().imagesFromUrls([thumb], productId, this.client.id);
      return res[0];
    }

    const res = await new ImageService().imagesFromUrls([thumb.url], productId, this.client.id);
    return res[0];
  }

  protected cleanUpProductForUpdate(product: any) {
    return {
      rating: product.rating,
      ratings: product.ratings,
      price: product.price,
      firstTime: false,
      updatedAt: product.updatedAt,
    }
  }

  async createElasticSearchIndex(es: ElasticSearchService) {
    const index = this.client.elasticSearch.index;

    try {
      await es.client.indices.create({
        index,
        ...this.client.elasticSearch.indexTemplate,
      });
    }
    catch (e) {
      console.log(`Error creating index ${index}`, e);
    }

    ScrapersModule.logger.log(`Created index ${this.client.elasticSearch.index}`)
  }

  protected async processCategories(categories: {title: string, slug: string}[]): Promise<IBaseCategoryModel[]> {

    // The categories are a flat array. We need to create a tree structure. Then save them to the database.
    // Finally, we will return the flat structure but with parentIds.
    const service = new ProductCategoryRedisModel();

    const categoriesModel = categories.map(category => {
      return {
        ...category,
        id: service.generateId({ clientId: this.client.id, slug: category.slug }),
      }
    });

    const tree = createNestedTree(categoriesModel as IBaseCategoryModel[]);

    try {
      await service.addCategoriesToDb(this.client.id, tree);
    }
    catch (e) {
      console.log(`Error saving categories to DB`, e);
    }

    const flat = flattenTree(tree);
    return [flat[flat.length - 1]] as IBaseCategoryModel[];

  }
}
