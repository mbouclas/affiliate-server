import { IBaseImageModel, ISeoFields, ITagModel } from "~models/general";

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
    tags?: ITagModel[];
}



export interface ITechnicalDetail {
    title: string;
    value: string;
    slug: string;
}
