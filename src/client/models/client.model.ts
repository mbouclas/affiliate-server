export interface IBaseClientExportConfig {
  destination: string;
  save: boolean
}
export interface IClientMdxConfig extends IBaseClientExportConfig {
}
export interface IClientJsonConfig extends IBaseClientExportConfig {

}

export interface IClientElasticSearchConfig {
  save: boolean;
  index: string;
  indexTemplate: any;
}

export interface IClientConfig {
  id: string;
  mdx: IClientMdxConfig;
  json: IClientJsonConfig;
  elasticSearch: IClientElasticSearchConfig;
}
