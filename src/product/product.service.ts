import { Injectable } from "@nestjs/common";
import { ElasticSearchService, ISearchArgs } from "~es/elastic-search.service";
import { ClientService } from "~root/client/client.service";
import { IElasticSearchAggregationBucketResult, IElasticSearchFilterMap } from "~es/elastic-search.models";
import { IGenericObject } from "~models/general";
import { extractSingleFilterFromObject } from "~helpers/data";
import { IProductModel } from "~root/product/models/product.model";
const crypto = require('crypto');
const slug = require('slug');

@Injectable()
export class ProductService {
  protected es: ElasticSearchService;
  protected client;
  protected defaultSort = 'updatedAt';
  protected defaultWay: 'asc'|'desc' = 'desc';
  protected allowedSortFields = [
    'updatedAt', 'price', 'title'
  ];
  protected defaultAggregationSize = 30;
  protected debugMode = false;
  protected hiddenFields = [

  ];

  protected autoCompleteFields = [
    'title',
    'id',
    'sku',
    'description',
    'about',
  ];

  // Fields not included in aggregations
  protected searchFields: IElasticSearchFilterMap[] = [
    {
      name: 'id',
      type: "simple",
      key: '_id',
      isKeyword: true,
    },
    {
      name: 'active',
      type: "simple",
      key: 'active',
      isKeyword: false,
    },
    {
      name: 'sku',
      type: "simple",
      key: 'sku',
      isKeyword: false,
    },
  ];

  // any of these fields can be searched on using the [] notation
  // categories[] = 'slug'
  // rating[]= 1-2
  protected aggregationFields: IElasticSearchFilterMap[] = [
    {
      name: 'categories',
      multilingual: false,
      type: "nested",
      key: 'slug',
      buckets: ['title.keyword', 'slug'],
      isKeyword: true,
      size: 60,
    },
/*    {
      name: 'technicalDetails',
      alias: 'colour',
      multilingual: false,
      type: "nested",
      key: 'slug',
      buckets: ['value.keyword', 'slug'],
      isKeyword: true,
      size: 100,
      fixSlugs: true,
    },*/
    {
      name: 'manufacturer',
      multilingual: false,
      type: "nested",
      key: 'slug',
      buckets: ['name.keyword', 'slug'],
      isKeyword: true,
      size: 60,
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
    {
      name: 'price',
      type: "range",
      isKeyword: false,
      size: this.defaultAggregationSize,
      field: 'price',
      ranges: [
        { to: 10.0 },
        { from: 10.0, to: 50.0 },
        { from: 50.0, to: 100.0 },
        { from: 100.0, to: 200.0 },
        { from: 200.0, to: 500.0 },
        { from: 500.0 }
      ],
      boost: 2,
    },
    {
      name: 'rating',
      type: "range",
      isKeyword: false,
      size: this.defaultAggregationSize,
      field: 'rating',
      ranges: [
        { to: 1.0 },
        { from: 1.0, to: 2.0 },
        { from: 3.0, to: 4.0 },
        { from: 4.0 }
      ],
      boost: 2,
    },
    {
      name: 'ratings',
      type: "range",
      isKeyword: false,
      size: this.defaultAggregationSize,
      field: 'ratings',
      ranges: [
        { to: 10.0 },
        { from: 10.0, to: 500.0 },
        { from: 500.0, to: 1000.0 },
        { from: 1000.0, to: 3000.0 },
        { from: 3000.0, to: 5000.0 },
        { from: 5000.0 }
      ],
      boost: 2,
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

  async find(args: ISearchArgs, withAggregations = false, debug = false) {
    args.page = args.page || 1;
    args.limit = args.limit || 10;
    args.queryParameters = args.queryParameters || {};

    const q = this.es
      .resetIndex()
      .resetFilters()
      .setIndex(this.client.elasticSearch.index)
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

    return {...res, ...{data}};
  }

  async update(filter: IGenericObject, doc: Partial<IProductModel>) {
    const {key, value} = extractSingleFilterFromObject(filter);
    const product = await this.findOne({[key]: value});
    if (!product) {
      throw new Error(`Product with ${key} ${value} not found`);
    }

    doc.id = product.id;
    doc.updatedAt = new Date();

    if (Array.isArray(doc.technicalDetails)) {
      doc.technicalDetails = doc.technicalDetails.map(detail => {
        detail.slug = slug(detail.title, {lower: true});
        return detail;
      });
    }

    try {
      await this.es.client.update({
        index: this.client.elasticSearch.index,
        id: product.id,
        doc_as_upsert: false,
        doc,
        refresh: true,
      });
    }
    catch (e) {
      console.log(`Error saving ${product.slug} to ES`, e);
    }

    return await this.findOne({[key]: value});
  }

  async store(document: Partial<IProductModel>) {
    document.createdAt = new Date();
    document.updatedAt = new Date();
    document.title = document.title.trim();
    document.id = crypto.createHash('md5').update(`${document.clientId}:${document.title}`).digest("hex");


    document.slug = slug(document.title, {lower: true});
    document.active = false;

    try {
      await this.es.client.index({
        id: document.id,
        index: this.client.elasticSearch.index,
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
    const product = await this.findOne({[key]: value});
    if (!product) {
      throw new Error(`Product with ${key} ${value} not found`);
    }

    try {
      await this.es.client.delete({
        index: this.client.elasticSearch.index,
        id: product.id,
        refresh: true,
      });
    }
    catch (e) {
      console.log(`Error deleting ${product.slug} from ES`, e);
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

  /**
   * Look up in cache to get the proper slugs for this type of doc
   * @param aggregation
   * @private
   */
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
    const product = await this.findOne({id});
    // find the image in the images
    const foundIndex = product.images.findIndex(i => i.id === imageId);
    const thumb = Object.assign({}, product.images[foundIndex]);

    // remove this image from the list
    product.images.splice(foundIndex, 1);
    //add the existing thumb to the bottom of the list
    product.images.push(product.thumb);
    product.thumb = thumb;

    product.images = product.images.map((img,idx) => ({...img, order: idx}));

    try {
      await this.update({ id }, {
        images: product.images,
        thumb: product.thumb,
      });
    }
    catch (e) {
      console.log(`Error saving ${product.slug} to ES`, e);
      throw new Error(`Error saving ${product.slug} to ES`);
    }

    return product;
  }
}
