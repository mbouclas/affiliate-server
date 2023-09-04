import { IBaseImageModel, ISeoFields, ITagModel } from "~models/general";


export interface IPageModel {
  id: string;
  title: string;
  slug: string;
  description: string;
  active: boolean;
  thumb: IBaseImageModel;
  images: IBaseImageModel[];
  createdAt: Date;
  updatedAt: Date;
  clientId: string;
  seo: ISeoFields;
  tags?: ITagModel[];
}
