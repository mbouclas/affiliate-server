export interface IPreviewServer {
  location: string;
  baseUrl: string;
  scripts: IPreviewServerScripts;
}
export interface IPreviewServerScripts {
  dev: string;
  dumpData: string;
}
export interface IPreviewServerConfig {
  server: IPreviewServer;
  modules: IPreviewServerModules;
}
export interface IPreviewServerPaths {
  product: string;
  category: string;
}
export interface IPreviewServerModule {
  paths: IPreviewServerPaths;
}
export interface IPreviewServerModules {
  Product: IPreviewServerModule;
  Page: IPreviewServerModule;
}

