import { Injectable } from "@nestjs/common";
import { ElasticSearchService, ISearchArgs } from "~es/elastic-search.service";
import { IElasticSearchAggregationBucketResult, IElasticSearchFilterMap } from "~es/elastic-search.models";
import { ClientService } from "~root/client/client.service";
import { IGenericObject, IPagination } from "~models/general";
import { IPageModel } from "~cms/models/page.model";
import { extractSingleFilterFromObject } from "~helpers/data";
import { TagService } from "~tag/tag.service";
const crypto = require('crypto');
const slug = require('slug');

@Injectable()
export class PageService {
  protected es: ElasticSearchService;
  protected client;
  protected defaultSort = "updatedAt";
  protected defaultWay: "asc" | "desc" = "desc";
  protected allowedSortFields = [
    "updatedAt", "title"
  ];
  protected defaultAggregationSize = 30;
  protected debugMode = false;
  protected hiddenFields = [];

  protected autoCompleteFields = [
    "title",
    "id",
    "description",
    "excerpt"
  ];


  // Fields not included in aggregations
  protected searchFields: IElasticSearchFilterMap[] = [
    {
      name: "id",
      type: "simple",
      key: "_id",
      isKeyword: true
    },
    {
      name: "active",
      type: "simple",
      key: "active",
      isKeyword: false
    },
    {
      name: "thumbCount",
      type: "nested",
      key: "thumb.id.keyword",
      isKeyword: false
    },
    {
      name: "imageCount",
      type: "nested",
      key: "images.id.keyword",
      isKeyword: false
    }
  ];

  protected aggregationFields: IElasticSearchFilterMap[] = [
    {
      name: "categories",
      multilingual: false,
      type: "nested",
      key: "slug",
      buckets: ["title.keyword", "slug"],
      isKeyword: true,
      size: 60
    },
    {
      name: 'tags',
      multilingual: false,
      type: "nested",
      key: 'slug',
      buckets: ['name.keyword', 'slug'],
      isKeyword: true,
      size: 60,
    },
  ];

  constructor(protected clientId: string) {
    this.client = new ClientService().getClient(clientId);
    this.es = ElasticSearchService.newInstance();
  }

  getEs() {
    return this.es;
  }

  async findOne(filter: IGenericObject) {
    const res = await this.find({queryParameters: filter});
    if (res.total === 0) {
      return null
    }

    return res.data[0]
  }

  async find(args: ISearchArgs, withAggregations = false, debug = false): Promise<IPagination<IPageModel>> {
    args.page = args.page || 1;
    args.limit = args.limit || 10;
    args.queryParameters = args.queryParameters || {};

    const q = this.es
      .resetIndex()
      .resetFilters()
      .setIndex(this.client.cms.elasticSearch.index)
      .setAutoCompleteFields(this.autoCompleteFields)
      .setAggregationFields(this.aggregationFields)
      .setSearchWithAggregations(withAggregations)
      .addSort(this.formatSort(args.queryParameters.sort), this.formatSortWay(args.queryParameters.way))
      .setDebugMode(debug);

    if (args.q) {
      q.filterAggregationsBasedOnQueryString(args.q);
      q.addAutoCompleteQuery(args.q, 'must');
    }

    for (let key in args.queryParameters) {
      let found = this.aggregationFields.find(field => {
        if (field.alias) {
          return field.alias === key;
        }

        return field.name === key;
      });

      if (!found) {
        continue;
      }


      if (!Array.isArray(args.queryParameters[key]) && found.type !== 'range') {
        //convert to bool here, mind the array
        const val = (found.fieldType === 'boolean') ? (args.queryParameters[key] === 'false' ? false : true) : args.queryParameters[key];
        found.type === "simple" ? q.addTermFilter(key, val) : q.addNestedFilter(`${key}.slug`, val);
      }
      else if (typeof args.queryParameters[key] === 'object' && found.type === 'range') {
        q.addRangeQuery(key, found.dataType === 'number' ? parseInt(args.queryParameters[key]) : args.queryParameters[key], 'must', found.boost || 1);
      }
      else {
        args.queryParameters[key].forEach(value => {
          const val = (found.fieldType === 'boolean') ? (value === 'false' ? false : true) : value;
          let nestedValueQuery = `${key}.slug`;
          if (found.alias) {
            // we use the .keyword cause these fields are dynamic and not in the index
            nestedValueQuery = found.slugKey ? `${found.name}.${found.slugKey}.keyword` : `${found.name}.slug`;
          }
          found.type === "simple" ? q.addTermFilter(key, val) : q.addNestedFilter(nestedValueQuery, val);
        });
      }

    }

    for (let key in args.queryParameters) {
      const found = this.searchFields.find(field => {
        if (field.alias) {
          return field.alias === key;
        }

        return field.name === key;
      });

      if (!found) {
        continue;
      }

      q.addMustQuery([{match: {[found.key]: args.queryParameters[key]}}]);
    }



    const res = await q.search(args.limit, args.page);

    res.aggregations = await this.fixAggregationSlugs(res.aggregations);

    // Return fields that are not hidden
    const data = res.data.map(item => {

      for (let key in item) {
        if (this.hiddenFields.indexOf(key) === -1) {continue;}

        delete item[key];
      }

      return item;
    });

    return {...res, ...{data}} as unknown as IPagination<IPageModel>;
  }

  async update(filter: IGenericObject, doc: Partial<IPageModel>) {
    const {key, value} = extractSingleFilterFromObject(filter);
    const item = await this.findOne({[key]: value});
    if (!item) {
      throw new Error(`Page with ${key} ${value} not found`);
    }

    doc.id = item.id;
    doc.updatedAt = new Date();

    if (Array.isArray(doc.tags)) {
      for (let idx = 0; doc.tags.length > idx; idx++) {
        if (!doc.tags[idx].slug) {
          const found = await TagService.findOne({name: doc.tags[idx].name});
          if (!found) {
            doc.tags[idx].slug = slug(doc.tags[idx].name, {lower: true});
            continue;
          }

          doc.tags[idx] = await TagService.findOne({name: doc.tags[idx].name});
        }
      }
    }

    try {
      await this.es.client.update({
        index: this.client.cms.elasticSearch.index,
        id: item.id,
        doc_as_upsert: false,
        doc,
        refresh: true,
      });
    }
    catch (e) {
      console.log(`Error saving ${item.slug} to ES`, e);
    }

    return await this.findOne({[key]: value});
  }

  async store(document: Partial<IPageModel>) {
    document.createdAt = new Date();
    document.updatedAt = new Date();
    document.title = document.title.trim();
    document.id = crypto.createHash('md5').update(`${document.clientId}:${document.title}`).digest("hex");


    document.slug = slug(document.title, {lower: true});
    document.active = false;

    try {
      await this.es.client.index({
        id: document.id,
        index: this.client.cms.elasticSearch.index,
        document,
        refresh: true,
      });
    }
    catch (e) {
      console.log(`Error saving ${document.slug} to ES`, e);
    }

    return await this.findOne({id: document.id});
  }

  async delete(filter: IGenericObject) {
    const {key, value} = extractSingleFilterFromObject(filter);
    const item = await this.findOne({[key]: value});
    if (!item) {
      throw new Error(`Product with ${key} ${value} not found`);
    }

    try {
      await this.es.client.delete({
        index: this.client.cms.elasticSearch.index,
        id: item.id,
        refresh: true,
      });
    }
    catch (e) {
      console.log(`Error deleting ${item.slug} from ES`, e);
    }
  }

  private async fixAggregationSlugs(aggregations: IElasticSearchAggregationBucketResult[] | any[]) {

    for (let idx = 0; this.es.aggregationFields.length > idx; idx++) {

      if (!this.es.aggregationFields[idx].fixSlugs) {continue;}

      const aggregationIdx = aggregations.findIndex(a => a.key === this.es.aggregationFields[idx].name);

      if (aggregationIdx === -1) {continue;}



      aggregations[aggregationIdx] = await this.fixAggregationSlug(aggregations[aggregationIdx], this.es.aggregationFields[idx]);
    }

    return aggregations;
  }

  private fixAggregationSlug(aggregation: IElasticSearchAggregationBucketResult, field: IElasticSearchFilterMap) {

    /*let data;
    try {
      data = await (new CacheWpendpointsService(new HttpService())).getFromCache(aggregation.key);
    }
    catch (e) {
      console.log(`Could not get ${aggregation.key} from cache`, e)

      return aggregation;
    }



    */

    /*    if (field.alias) {
          aggregation['key'] = field.alias;
        }*/

    /*    aggregation.results.forEach((res, idx) => {
          const found = data.find(d => res.key === d.name);
          if (!found) {return;}
          aggregation.results[idx].slug = found.slug;
        })*/

    return aggregation;
  }


  protected formatSort(sort: string) {
    if (this.allowedSortFields.indexOf(sort) !== -1) {return sort}

    return this.defaultSort;
  }

  protected formatSortWay(way: 'asc'|'desc') : 'asc'|'desc' {
    if (['asc', 'desc'].indexOf(way) !== -1) {return way}

    return this.defaultWay;
  }

  async changeThumb(id: string, imageId: string) {
    // find the product
    const item = await this.findOne({id});
    // find the image in the images
    const foundIndex = item.images.findIndex(i => i.id === imageId);
    const thumb = Object.assign({}, item.images[foundIndex]);

    // remove this image from the list
    item.images.splice(foundIndex, 1);
    //add the existing thumb to the bottom of the list
    item.images.push(item.thumb);
    item.thumb = thumb;

    item.images = item.images.map((img,idx) => ({...img, order: idx}));

    try {
      await this.update({ id }, {
        images: item.images,
        thumb: item.thumb,
      });
    }
    catch (e) {
      console.log(`Error saving ${item.slug} to ES`, e);
      throw new Error(`Error saving ${item.slug} to ES`);
    }

    return item;
  }
}
