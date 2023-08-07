import { IBaseImageModel } from "~models/general";

export interface IProductModel {
    id: string;
    title: string;
    slug: string;
    description: string;
    price: number;
    sku: string;
    active: boolean;
    thumb: IBaseImageModel;
    images: IBaseImageModel[];
    createdAt: Date;
    updatedAt: Date;
    clientId: string;
    technicalDetails: ITechnicalDetail[];
    seo: ISeoFields;
}

export interface ISeoFields {
    title: string;
    description: string;
    keywords: string;
    image?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    ogUrl?: string;
    ogType?: string;
    ogSiteName?: string;
    ogLocale?: string;
}

export interface ITechnicalDetail {
    title: string;
    value: string;
    slug: string;
}
