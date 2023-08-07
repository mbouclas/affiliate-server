import { IImageRedisModel } from "~image/image-redis-model";
import { IBaseCategoryModel } from "~helpers/tree";
import { ITagModel } from "~models/general";

export interface IZyteProductResponse {
  url: string;
  statusCode: number;
  product: IZyteProduct;
}
export interface IZyteProduct {
  id?: string|number;
  name: string;
  price: string|number;
  currency: string;
  currencyRaw: string;
  availability: string;
  sku: string;
  brand: Brand;
  breadcrumbs?: (Breadcrumbs)[] | null;
  mainImage: MainImage;
  images?: (Images)[] | null;
  description: string;
  descriptionHtml: string;
  aggregateRating: AggregateRating;
  color?: string;
  size?: string;
  style?: string;
  additionalProperties?: (AdditionalProperties)[] | null;
  features?: (string)[] | null;
  url: string;
  canonicalUrl: string;
  metadata: Metadata;
  variants?: (Variants)[] | null;
  thumb?: IImageRedisModel;
  categories?: IBaseCategoryModel[];
  rating?: number;
  ratings?: number;
  technicalDetails?: ITechnicalDetail[];
  affiliateUrl?: string;
  slug?: string;
  title?: string;
  clientId?: string;
  tags?: ITagModel[];
}

interface ITechnicalDetail {
  title: string;
  slug: string;
  value: string;
}

interface Brand {
  name: string;
}
interface Breadcrumbs {
  name: string;
  url: string;
}
interface MainImage {
  url: string;
}
interface Images {
  url: string;
}
interface AggregateRating {
  ratingValue: number;
  reviewCount: number;
}
interface AdditionalProperties {
  name: string;
  value: string;
}
interface Metadata {
  probability: number;
  dateDownloaded: string;
}
interface Variants {
  color: string;
}
