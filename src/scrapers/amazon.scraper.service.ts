import { Injectable } from "@nestjs/common";
import { BaseScraperService, IScraperJobPayload, ScraperEvents } from "~scrapers/base-scraper.service";
import { OnEvent } from "@nestjs/event-emitter";

const slug = require("slug");
import { resolve } from "path";
import { ScrapersModule } from "~scrapers/scrapers.module";
import fs, { existsSync, writeFileSync } from "fs";
import { ElasticSearchService } from "~es/elastic-search.service";
import { SharedModule } from "~shared/shared.module";
import { ProductService } from "~root/product/product.service";
import { ProductCategoryRedisModel } from "~root/product-category/product-category-redis-model";
import { createNestedTree, flattenTree } from "~helpers/tree";
import { ImageService } from "~image/image.service";


@Injectable()
export class AmazonScraperService extends BaseScraperService {
/*  @OnEvent("app.loaded")
  async onAppLoaded() {
    // const s = new AmazonScraperService();
    try {

      // await this.init('techSalon');
      // await this.processUrls(["https://amzn.to/3ruXGYd",]);
    } catch (e) {
      console.log(`Error scraping ${e.message}`, e);
    }
  }*/

  async scrape(item: IScraperJobPayload) {
    await this.page.goto(item.url, {
      timeout: this.timeout
    });
    await this.page.screenshot({ path: "example.png" });
    console.log("Processing link: ", item.url);

    const info = await this.page.evaluate((link) => {
      const ret = {
        title: "",
        sku: '',
        description: '',
        price: 0,
        rating: "0",
        ratings: "0",
        variants: [],
        about: '',
        details: '',
        images: [],
        categories: [],
        technicalDetails: [],
        colors: [],
      };
      try {
        ret.title = document.querySelector("#productTitle").textContent.trim();
      } catch (e) {
        console.log(`Could not find title`);
      }

      try {
        ret.sku = document.querySelector('#productDetails_detailBullets_sections1 > tbody > tr:nth-child(1) > td').textContent.trim();
      }
      catch (e) {
        console.log(`Could not find sku`);
      }

      try {
        let price1;
        price1 = document.querySelector(".a-price-whole");
        const price2 = document.querySelector(".a-price-fraction");
        ret.price = parseFloat(price1.textContent + price2.textContent);
      } catch (e) {
        console.log(`Could not find price`);
      }

      try {
        ret.rating = document.querySelector("#acrPopover > span.a-declarative > a > span").textContent;
      } catch (e) {
        console.log(`Could not find rating`);
      }

      try {
        ret.ratings = document.querySelector("#acrCustomerReviewText").textContent;
      } catch (e) {
        console.log(`Could not find ratings`);
      }


      const variants = Array.from(document.querySelectorAll(".twisterTextDiv"));
      const about = Array.from(document.querySelectorAll("#feature-bullets > ul > li"));
      const details = Array.from(document.querySelectorAll("#productDetailsTable .a-size-base.prodDetAttrValue"));
      const categories = Array.from(document.querySelectorAll("#wayfinding-breadcrumbs_feature_div li a"));

      const colors = Array.from(document.querySelectorAll('.imgSwatch'))
        .map(color => {
          return {
            name: color.getAttribute('alt'),
            image: color.getAttribute('src')
          }
        });

      let technicalDetails = Array.from(document.querySelectorAll('#productDetails_techSpec_section_1 > tbody > tr'))
        .map(row => {
          return {
            title: row.querySelector('th').textContent.trim(),
            value: row.querySelector('td').textContent.trim()
          }
        });

      let backupDetails = Array.from(document.querySelectorAll('#detailBullets_feature_div > ul > li'))
        .map(row => {
          const regex = /(\w+)/g;
          let title = row.querySelector('span > span.a-text-bold').textContent;
          let value = row.querySelector('span > span:nth-child(2)').textContent;
          const labelMatch = title.trim().match(regex);
          const valueMatch = value.trim().match(regex);

          if (Array.isArray(labelMatch)) {
            title = labelMatch.join(' ');
          }
          if (Array.isArray(valueMatch)) {
            value = valueMatch.join(' ');
          }

          return {
            title,
            value
          }
        })

      if (technicalDetails.length === 0) {
        technicalDetails = backupDetails;

      }

      if (ret.sku === '') {
        const found = technicalDetails.find(detail => detail.title === 'ASIN');
        if (found) {
          ret.sku = found.value;
        }
      }

      return {
        ...ret, ...{
          colors,
          technicalDetails,
          ratings: parseInt(ret.ratings.replace(" ratings", "")),
          variants: variants.map(variant => {
            return variant.textContent.trim();
          }),
          about: about.map(item => {
            return item.textContent.trim();
          }).join('\n'),
          details: details.map(detail => {
            return detail.textContent.trim();
          }).join('\n'),
          categories: categories.map(category => {
            return category.textContent.trim();
          })
        }
      };
    });


    info.affiliateUrl = item.url;


    const code = await this.page.$x("//script[contains(., \"ImageBlockATF\")]");
    const content = await this.page.evaluate(el => el.innerHTML, code[0]);


    const pattern = /"hiRes":"([^"]+)"/g;
    const matches = content.match(pattern);
    info.images = [];
    if (matches) {
      info.images = matches.map(function(match) {
        return match.match(/"hiRes":"([^"]+)"/)[1];
      });
    }


    if (this.client.mdx.save) {
      await this.writeMdx(info, resolve(this.client.mdx.destination));
    }

    const product = this.formatJson(info);
    product.id = item.id;
    product.clientId = item.clientId;
    await this.processImages(product);
    await this.processCategories(product);

    if (this.client.json.save) {
      await this.writeJson(product, resolve(this.client.json.destination));
    }


    if (this.client.elasticSearch.save) {
      await this.saveToElasticSearch(product);
    }

    ScrapersModule.logger.log(`Processed ${item.url}`);
    SharedModule.eventEmitter.emit(ScraperEvents.SCRAPE_SUCCESS, product);

    try {
      await this.page.close();
      await this.browser.close();
    }
    catch (e) {
      console.log(`Error closing browser ${e.message}`,  e);
    }

    return info;
  }

  async writeMdx(product, destination: string) {
    const productSlug = slug(product.title, { lower: true });
    const categories = product.categories.map(category => ({
      slug: slug(category, { lower: true }),
      title: category
    }));
    const template = `---
title: "${product.title}"
slug: ${productSlug}
categories: ${JSON.stringify(categories)}
---

`;

    const file = resolve(destination, `${productSlug}.mdx`);

    if (!existsSync(file)) {
      writeFileSync(file, template);
    }
    ScrapersModule.logger.log(`Writing MDX file for ${product.title}`);
  }

  formatJson(product) {
    const temp = Object.assign({}, product);
    temp.slug = slug(temp.title, { lower: true });

    temp.categories = temp.categories.map(category => {
      if (typeof category !== "string") {
        return category;
      }


      return {
        slug: slug(category, { lower: true }),
        title: category,
      };

    });
    temp.rating = parseFloat(temp.rating);
    temp.ratings = parseInt(temp.ratings);

    temp.technicalDetails = temp.technicalDetails.map(detail => {
      return {
        ...detail, ...{
          firstTime: false,
          slug: slug(detail.title, { lower: true })
        }
      }
    });

    temp.colors = temp.colors.map(color => {
      return {
        ...color, ...{
          slug: slug(color.name, { lower: true })
        }
      }
    });

    return temp;
  }

  async writeJson(product, destination: string) {
    if (existsSync(destination)) {
      product.updatedAt = new Date().toISOString();
    } else {
      product.createdAt = new Date().toISOString();
    }

    writeFileSync(resolve(destination, `${product.slug}.json`), JSON.stringify(this.formatJson(product), null, 2));

    ScrapersModule.logger.log(`Writing JSON file for ${product.title}`);
  }

  async saveToElasticSearch(product) {
    const es = ElasticSearchService.newInstance();
    const exists = await es.indexExists(this.client.elasticSearch.index);

    if (!exists) {
      await this.createElasticSearchIndex(es);
    }

    const json = this.formatJson(product);

    const existingDoc = await (new ProductService(this.client.id)).findOne({id: product.id});

    if (!existingDoc) {
      json.firstTime = true;
    }

    if (!json.variants || !Array.isArray(json.variants)) {
      json.variants = [];
    }

    json.variants = json.variants.map(variant => {
      if (typeof variant !== "string") {
        return variant;
      }

      return {
        title: variant,
        slug: slug(variant, { lower: true }),
      }
    });

    if (existingDoc) {
      await (new ProductService(this.client.id)).update({id: json.id}, this.cleanUpProductForUpdate(json));
      ScrapersModule.logger.log(`Synced ${product.slug} with ES`);
      return;
    }

    try {
      await (new ProductService(this.client.id)).store(json);
    }
    catch (e) {
      console.log(`Error storing ${json.slug} in ES`, e);
    }


    ScrapersModule.logger.log(`Synced ${product.slug} with ES`);
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

  private async processImages(product: any) {
    if (!Array.isArray(product.images)) {
      return [];
    }

    product.images = await new ImageService().imagesFromUrls(product.images, product.id, this.client.id);
    product.thumb = product.images[0];
    return product;
  }

  /**
   * Sanitize for automatic updates. Don't want to overwrite anything that shouldn't be overwritten.
   * @param json
   * @private
   */
  private cleanUpProductForUpdate(json: any) {
    return {
      rating: json.rating,
      ratings: json.ratings,
      price: json.price,
      firstTime: false,
      updatedAt: json.updatedAt,
    }
  }

  private async processCategories(product: any) {
    // The categories are a flat array. We need to create a tree structure. Then save them to the database.
    // Finally, we will return the flat structure but with parentIds.

    const service = new ProductCategoryRedisModel();
    const tree = createNestedTree(product.categories.map(category => {
      return {
        ...category,
        id: service.generateId({ clientId: this.client.id, slug: category.slug }),
      }
    }));

    try {
      await service.addCategoriesToDb(this.client.id, tree);
    }
    catch (e) {
      console.log(`Error saving categories to DB`, e);
    }

    const flat = flattenTree(tree);
    product.categories = [flat[flat.length - 1]];

    return product;
  }
}
