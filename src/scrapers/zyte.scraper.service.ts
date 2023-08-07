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


const mockResponse = {
  "url": "https://www.amazon.de/-/en/Electric-Salt-Pepper-Mill-Set/dp/B09TVW9ZY1/",
  "statusCode": 200,
  "product": {
    "name": "Electric Salt and Pepper Mill Set - Rechargeable USB Cable, LED Lights, Automatic Pepper and Salt Mill Set, Refillable, Adjustable Coarseness (Black-Brown, Pack of 2)",
    "price": "52.99",
    "currency": "EUR",
    "currencyRaw": "€",
    "availability": "InStock",
    "sku": "B09TVW9ZY1",
    "brand": {
      "name": "ZEREAA"
    },
    "breadcrumbs": [
      {
        "name": "Home & Kitchen",
        "url": "https://www.amazon.de/-/en/k%C3%83%C2%BCche-haushalt-wohnen/b/ref=dp_bc_aui_C_1/260-8285127-3283730?ie=UTF8&node=3167641"
      },
      {
        "name": "Cooking & Dining",
        "url": "https://www.amazon.de/-/en/b/ref=dp_bc_aui_C_2/260-8285127-3283730?ie=UTF8&node=20679858031"
      },
      {
        "name": "Kitchen Storage & Organisation",
        "url": "https://www.amazon.de/-/en/Aufbewahrung-Ordnungssysteme-Kueche/b/ref=dp_bc_aui_C_3/260-8285127-3283730?ie=UTF8&node=3437570031"
      },
      {
        "name": "Dressing & Spice Dispensers",
        "url": "https://www.amazon.de/-/en/Dressing-Gewuerzspender/b/ref=dp_bc_aui_C_4/260-8285127-3283730?ie=UTF8&node=3437571031"
      },
      {
        "name": "Pepper Mills",
        "url": "https://www.amazon.de/-/en/Pfefferm%C3%BChlen-M%C3%BChlen-M%C3%B6rser-K%C3%BCchenhelfer/b/ref=dp_bc_aui_C_5/260-8285127-3283730?ie=UTF8&node=13017101"
      }
    ],
    "mainImage": {
      "url": "https://m.media-amazon.com/images/I/714xhSXrLWL._AC_SX569_.jpg"
    },
    "images": [
      {
        "url": "https://m.media-amazon.com/images/I/51mmMDW6cDL._AC_US75_.jpg"
      },
      {
        "url": "https://m.media-amazon.com/images/I/51r1cdtKYnL._AC_US75_.jpg"
      },
      {
        "url": "https://m.media-amazon.com/images/I/51SE1WrFNfL._AC_US75_.jpg"
      },
      {
        "url": "https://m.media-amazon.com/images/I/714xhSXrLWL._AC_SX569_.jpg"
      },
      {
        "url": "https://m.media-amazon.com/images/I/51NOwqHZozL._AC_US75_.jpg"
      },
      {
        "url": "https://m.media-amazon.com/images/I/514ouQnJGtL._AC_US75_.jpg"
      },
      {
        "url": "https://m.media-amazon.com/images/I/31-11AUKW1L.SS125_PKplay-button-mb-image-grid-small_.jpg"
      },
      {
        "url": "https://m.media-amazon.com/images/I/41FXu4Li0zL._AC_US75_.jpg"
      }
    ],
    "description": "Gentle, powerful and quiet\n\nThis salt mill is very quiet at only 65 dB in operation. The electric salt and pepper mill set is equipped with a durable, powerful and quiet ceramic motor that can effortlessly crush pepper, fresh Himalayan salt or your favorite spice to unfold its wonderful taste.\n\nPackage includes:\n\n2 x salt and pepper mills, 1 x instruction manual (English language not guaranteed), 1 x USB charging cable, 1 x brush, 1 x wooden spoon\n\n*Note: The mill does not contain spices\n\nWhy choose ZEREAA electric pepper mill?\n\nIdeal gift for family and friends\n\nFast USB ChargingExtra spoon & brush6-way adjustable coarsenessWarm LED light2-switch modesEasily removable bottom capsOne-handed operationAutomatic grindingSuitable for most spices\n\nHot tips:\nIf the LED light is not bright, please open the container, gently wipe the top of the container and then use again.\nRotate 180 degrees as 1 grinding level, please adjust the thickness according to the instructions of the product.\n\nFully charged in just 1 hour. After 5 minutes charging, you can grind 10 g of pepper.\n\nThe warm LED light turns on automatically during use, creating a warm and romantic atmosphere for your family or loved ones.\n\nSimply turn the knob at the top to adjust the desired coarseness, and easily control your spice grind level from coarse to extra fine in 6 levels.\n\nThis black pepper mill weighs only 256 g and is perfect for one-handed operation.\n\nHold down to start, more accurate control of grinding.\n\nEasy release bottom caps help keep your spices fresh and your kitchen tidy.",
    "descriptionHtml": "<article>\n\n<figure><img alt=\"electric salt and pepper mill set\" src=\"https://images-na.ssl-images-amazon.com/images/G/01/x-locale/common/grey-pixel.gif\" data-src=\"https://m.media-amazon.com/images/S/aplus-media-library-service-media/58a26fe6-e379-488f-a60b-6c0eed29e05b.__CR0,0,970,600_PT0_SX970_V1___.jpg\"></figure>\n\n<h2>Gentle, powerful and quiet</h2>\n\n<p>This salt mill is very quiet at only 65 dB in operation. The electric salt and pepper mill set is equipped with a durable, powerful and quiet ceramic motor that can effortlessly crush pepper, fresh Himalayan salt or your favorite spice to unfold its wonderful taste.</p>\n\n<figure><img alt=\"Versatile:\" src=\"https://images-na.ssl-images-amazon.com/images/G/01/x-locale/common/grey-pixel.gif\" data-src=\"https://m.media-amazon.com/images/S/aplus-media-library-service-media/7423ce66-e2f3-4584-8c77-9a4b4fb593a8.__CR0,0,970,600_PT0_SX970_V1___.jpg\"></figure>\n\n<figure><img alt=\"Ideal gift for family and friends\" src=\"https://images-na.ssl-images-amazon.com/images/G/01/x-locale/common/grey-pixel.gif\" data-src=\"https://m.media-amazon.com/images/S/aplus-media-library-service-media/06545cbc-fe1d-4d39-81a0-77d41c08933b.__CR0,0,300,400_PT0_SX300_V1___.png\"></figure>\n\n<figure><img alt=\"Package Includes\" src=\"https://images-na.ssl-images-amazon.com/images/G/01/x-locale/common/grey-pixel.gif\" data-src=\"https://m.media-amazon.com/images/S/aplus-media-library-service-media/bee93806-f3e6-49a2-8576-bf87c0fb00e2.__CR0,0,350,175_PT0_SX350_V1___.png\"></figure>\n\n<h4>Package includes:</h4>\n\n<p>2 x salt and pepper mills, 1 x instruction manual (English language not guaranteed), 1 x USB charging cable, 1 x brush, 1 x wooden spoon</p>\n\n<ul><li>  *Note: The mill does not contain spices  </li></ul>\n\n<h2>Why choose ZEREAA electric pepper mill?</h2>\n\n<h3>Ideal gift for family and friends</h3>\n\n<p>Fast USB ChargingExtra spoon &amp; brush6-way adjustable coarsenessWarm LED light2-switch modesEasily removable bottom capsOne-handed operationAutomatic grindingSuitable for most spices</p>\n\n<ul><li>  Hot tips:  </li>   <li>  If the LED light is not bright, please open the container, gently wipe the top of the container and then use again.  </li>   <li>  Rotate 180 degrees as 1 grinding level, please adjust the thickness according to the instructions of the product.  </li></ul>\n\n<table><tbody><tr>\n                <th>\n                    \n                        <p>\n                                                          <img alt=\"USB fast charging\" src=\"https://images-na.ssl-images-amazon.com/images/G/01/x-locale/common/grey-pixel.gif\" data-src=\"https://m.media-amazon.com/images/S/aplus-media-library-service-media/cb1ece45-26d9-4dfe-b33b-67b415b20cac.__CR0,0,300,300_PT0_SX300_V1___.jpg\">   </p>\n                    \n                </th>\n                <th>\n                    \n                        <p>\n                                                          <img alt=\"Automatic LED light\" src=\"https://images-na.ssl-images-amazon.com/images/G/01/x-locale/common/grey-pixel.gif\" data-src=\"https://m.media-amazon.com/images/S/aplus-media-library-service-media/c7ae2179-01bc-43c1-9fa7-1ac02c24ac08.__CR0,0,300,300_PT0_SX300_V1___.jpg\">   </p>\n                    \n                </th>\n                <th>\n                    \n                        <p>\n                                                          <img alt=\"6 adjustable coarseness\" src=\"https://images-na.ssl-images-amazon.com/images/G/01/x-locale/common/grey-pixel.gif\" data-src=\"https://m.media-amazon.com/images/S/aplus-media-library-service-media/4ba6b497-a9a3-47a3-8e53-c24ed767d7f0.__CR0,0,300,300_PT0_SX300_V1___.jpg\">   </p>\n                    \n                </th>\n            </tr>\n            <tr>\n                <td>\n                    \n                                                                                            <p> Fully charged in just 1 hour. After 5 minutes charging, you can grind 10 g of pepper. </p>    \n                </td>\n                <td>\n                    \n                                                                                            <p> The warm LED light turns on automatically during use, creating a warm and romantic atmosphere for your family or loved ones. </p>    \n                </td>\n                <td>\n                    \n                                                                                            <p> Simply turn the knob at the top to adjust the desired coarseness, and easily control your spice grind level from coarse to extra fine in 6 levels. </p>    \n                </td>\n            </tr>\n        </tbody></table>\n\n<table><tbody><tr>\n                <th>\n                    \n                        <p>\n                                                          <img alt=\"Easy control switch\" src=\"https://images-na.ssl-images-amazon.com/images/G/01/x-locale/common/grey-pixel.gif\" data-src=\"https://m.media-amazon.com/images/S/aplus-media-library-service-media/57d9492c-1ff9-42ba-9f92-a4aaec55d36a.__CR0,0,300,300_PT0_SX300_V1___.jpg\">   </p>\n                    \n                </th>\n                <th>\n                    \n                        <p>\n                                                          <img alt=\"One-handed operation\" src=\"https://images-na.ssl-images-amazon.com/images/G/01/x-locale/common/grey-pixel.gif\" data-src=\"https://m.media-amazon.com/images/S/aplus-media-library-service-media/99f7e142-863d-4319-b614-9aece850c349.__CR0,0,300,300_PT0_SX300_V1___.jpg\">   </p>\n                    \n                </th>\n                <th>\n                    \n                        <p>\n                                                          <img alt=\"Easy release base caps\" src=\"https://images-na.ssl-images-amazon.com/images/G/01/x-locale/common/grey-pixel.gif\" data-src=\"https://m.media-amazon.com/images/S/aplus-media-library-service-media/f54a223a-c84a-4a40-a165-c3ad08ab201f.__CR0,0,300,300_PT0_SX300_V1___.jpg\">   </p>\n                    \n                </th>\n            </tr>\n            <tr>\n                <td>\n                    \n                                                                                            <p> This black pepper mill weighs only 256 g and is perfect for one-handed operation. </p>    \n                </td>\n                <td>\n                    \n                                                                                            <p> Hold down to start, more accurate control of grinding. </p>    \n                </td>\n                <td>\n                    \n                                                                                            <p> Easy release bottom caps help keep your spices fresh and your kitchen tidy. </p>    \n                </td>\n            </tr>\n        </tbody></table>\n\n<figure><img alt=\"Following the symbol to turn on the grinder\" src=\"https://images-na.ssl-images-amazon.com/images/G/01/x-locale/common/grey-pixel.gif\" data-src=\"https://m.media-amazon.com/images/S/aplus-media-library-service-media/010de433-2040-41dc-aeaa-0afeb51cd4ff.__CR0,0,970,300_PT0_SX970_V1___.jpg\"></figure>\n\n</article>",
    "aggregateRating": {
      "ratingValue": 4.7,
      "reviewCount": 144
    },
    "color": "Black Brown X 2-led",
    "size": "‎17.7 x 12.8 x 5.7 cm; 256 Grams",
    "additionalProperties": [
      {
        "name": "colour name",
        "value": "Black Brown X 2-led"
      },
      {
        "name": "colour",
        "value": "Black Brown X 2-led"
      },
      {
        "name": "brand",
        "value": "ZEREAA"
      },
      {
        "name": "item weight",
        "value": "256 Grams"
      },
      {
        "name": "operation mode",
        "value": "Automatic"
      },
      {
        "name": "is dishwasher safe",
        "value": "No"
      },
      {
        "name": "package dimensions",
        "value": "‎17.7 x 12.8 x 5.7 cm; 256 Grams"
      },
      {
        "name": "batteries required",
        "value": "‎No"
      },
      {
        "name": "asin",
        "value": "B09TVW9ZY1"
      },
      {
        "name": "date first available",
        "value": "4 Mar. 2022"
      },
      {
        "name": "customer reviews",
        "value": "4.7 144 ratings 4.7 out of 5 stars"
      },
      {
        "name": "best sellers rank",
        "value": "13,805 in Home & Kitchen (See Top 100 in Home & Kitchen) 35 in Pepper Mills"
      }
    ],
    "features": [
      "Rechargeable USB Pepper Mill - No extra battery required, use the Type-C cable for fast charging. Fully charged in just 1 hour. After a charging time of 5 minutes, this electric salt and pepper mill set can grind 10 g of pepper, a type C cable is included.",
      "6 Adjustable Grinding Levels - Simply turn the knob on the top of each electric salt and pepper mill to adjust the desired grinding level. So you can easily adjust the texture of your spice grinder from coarse to extra fine in 6 levels. Perfect for grinding sea salt, black pepper, white pepper and other spices.",
      "Warm LED Light - No more cheap looking white light or unclear blue light, our automatic salt and pepper mill set with warm LED light is bright and gentle, adds a warm and romantic atmosphere for your family or loved ones. The light turns on automatically during grinding. This helps to prevent food from being spiced.",
      "Easy to use - One button control, just press the button for easy grinding. A black pepper mill weighs only 256g, perfect for one-handed operation. The salt and pepper mill set has a brush and a wooden spoon for cleaning and refilling.",
      "High quality - ceramic grinding cores grind the spices finer and more stable. PC food grade acrylic chamber design with no risk of glass breakage, this electric pepper mill has a base cover to keep your spices fresh and your kitchen tidy.",
      "100% Satisfaction Guarantee - If this pepper mill does not work, we recommend you charge it for 1 hour at the first use. If it still does not work, you can replace it for free. Welcome instructions, our worry-free 12-month warranty and friendly customer service."
    ],
    "url": "https://www.amazon.de/-/en/Electric-Salt-Pepper-Mill-Set/dp/B09TVW9ZY1/",
    "canonicalUrl": "https://www.amazon.de/-/en/Electric-Salt-Pepper-Mill-Set/dp/B09TVW9ZY1",
    "metadata": {
      "probability": 0.9610675573348999,
      "dateDownloaded": "2023-08-06T23:29:40Z"
    },
    "variants": [
      {
        "color": "Longer Version - Light Wood X 2-led"
      },
      {
        "color": "Longer Version-black-brown*2-led"
      },
      {
        "color": "Black Brown X 2-led"
      }
    ]
  }
};

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
      description: product.description,
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
