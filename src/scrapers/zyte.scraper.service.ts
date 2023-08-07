import { Injectable } from "@nestjs/common";
import { McmsDi } from "~helpers/mcms-component.decorator";
import { BaseExternalScraperService, ExternalScraperEvents } from "~scrapers/base-external-scraper.service";
import { IScraperJobPayload } from "~scrapers/base-scraper.service";
import { ScrapersModule } from "~scrapers/scrapers.module";
import { SharedModule } from "~shared/shared.module";
import { IZyteProduct, IZyteProductResponse } from "~scrapers/models/zyte.model";
import { store } from "~root/state";
import { OnEvent } from "@nestjs/event-emitter";
import { IGenericObject } from "~models/general";
import {
  CouldNotSaveProductToElasticSearchException
} from "~scrapers/exceptions/CouldNotSaveProductToElasticSearch.exception";
const slug = require("slug");

@Injectable()
@McmsDi({
  id: 'ZyteScraperService',
  type: 'service'
})
export class ZyteScraperService extends BaseExternalScraperService {
  baseApiUrl = 'https://api.zyte.com/v1/extract';


  async callApi(url: string): Promise<IZyteProductResponse> {
    const apiKey = store.getState().configs["scrapers"]['configs']['zyte']['apiKey'];
    const response = await fetch(this.baseApiUrl, {
      method: 'POST',
      body: JSON.stringify({
        url,
        product: true,
      }),
      headers:{
        Authorization: `Basic ${btoa(`${apiKey}:`)}`,
        "Content-Type": "application/json",
      }
    })

    return await response.json();
  }
  async scrape(item: IScraperJobPayload) {
    const response: IZyteProductResponse = await this.callApi(item.url);
    console.log(response)
    let product = response.product;
    product.id = item.id;
    product.clientId = item.clientId;
    product.affiliateUrl = item.url;
    await this.processImages(product);
    product.slug = slug(product.name, {lower: true});
    product.title = product.name;
    product.thumb = await this.processThumb(product.mainImage, product.id as string);
    product.categories = await this.processCategories(product.breadcrumbs.map(c => ({title: c.name, slug: slug(c.name, {lower: true})})));


    await this.formatProductForElasticSearch(product)
    try {
      await this.saveToElasticSearch(await this.formatProductForElasticSearch(product));
    }
    catch (e) {
      console.log(`Error saving to elastic search ${e}`, e);
      SharedModule.eventEmitter.emit(ExternalScraperEvents.SCRAPE_FAILED, { product, item, e });
      throw new CouldNotSaveProductToElasticSearchException(e.message, '1101.1', e);
    }

    ScrapersModule.logger.log(`Processed ${item.url}`);
    SharedModule.eventEmitter.emit(ExternalScraperEvents.SCRAPE_SUCCESS, product);
  }

  async formatProductForElasticSearch(product: IZyteProduct) {
    const temp: IGenericObject = {
      id: product.id,
      title: product.title,
      slug: product.slug,
      categories: product.categories,
      thumb: product.thumb,
      images: product.images,
      clientId: product.clientId,
      active: false,
      sku: product.sku,
      manufacturer: {
        ...product.brand,
        ...{slug: slug(product.brand.name, {lower: true})}
      },
      variants: Array.isArray(product.variants) ? product.variants.map(v => ({
        ...v,
        })): [],
      currency: product.currency,
      description: product.description,
      color: product.color || null,
      size: product.size || null,
      style: product.style || null,
      availability: product.availability || null,
      about: product.features.join('\n'),
      url: product.url,
      canonicalUrl: product.canonicalUrl,
    };

    temp.rating = product.aggregateRating.ratingValue;
    temp.ratings = product.aggregateRating.reviewCount;
    temp.price = parseFloat(product.price as string);
    temp.technicalDetails = product.additionalProperties.map(p => (
      {
        title: p.name,
        slug: slug(p.name, {lower: true}),
        value: p.value
      }));

    temp.tags = [];


    // console.log(temp)
    return temp;
  }
}
