import { IGenericObject } from "./general";
import {} from "zustand";

// import { ISiteRegionConfig } from "../publisher/publisher.service";

export interface IUserPreferencesModel {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    firstVisit?: boolean;
    hasEnabled2Fa?: boolean;
    dashboardWidgets?: IWidgetFromDB[];
    dashboardColumns?: number;
    userTheme?: string;
    [key: string]: any;
}

export interface IWidgetFromDB {
    settings: IGenericObject;
    id?: string;
    name: string;
    x: number;
    y: number;
    rows: number;
    cols: number;
}

export interface IUserConfig {
    UserSettings?: {
        InitialScreen?: string;
    },
    dashboardWidgets?: IWidgetFromDB[];
    requiresPasswordChange?: boolean;
    [key: string]: any;
}

export interface IGate {
    uuid?: string;
    gate: string;
    level: number;
    name: string;
    description?: string;
    provider: string;
}

export interface IDbModelFieldFilters {
}


export interface IDbModelFieldSettings {
    exported: boolean;
    isJson: boolean;
    isSlug: boolean;
    isSortable: boolean;
    isDisplayedColumn: boolean;
    disabled: boolean;
    translatable: boolean;
    translateOn: string;
    order: number;
    group: string;
    slugFrom: string;
    // itemSelectorConfig: DynamicFieldItemSelectorConfig;
    // options: DynamicFieldSelectOption;
}

export interface DbModelModel {
    uuid: string;
    name: string;
    modelName: string;
    createdAt: Date;
    updatedAt: Date;
    fieldSettings: IDbModelFieldSettings;
    fieldFilters: IDbModelFieldFilters;
}

export interface IBaseNamedModel {
    uuid: string;
    name: string;
}

export interface ILanguage extends IBaseNamedModel{
    code: string;
}


export interface IMcmsComponent {
    name: string;
    label: string;
    model: string;
    description: string;
    config?: IGenericObject;
    lang?: IGenericObject;
}



export interface IExportProviderConfigurator {
    name: string;
}

export interface IHomePage {
    categoryTreeKey: string,
    slider: any[],
    featured: any[],
}

interface IMcrmAuthState {
    accessToken: string;
    cookie: string;
}

export interface AppStateModel  {
    finishedBooting: boolean;
    gates: IGate[];
    configs: {[key: string]: any};
}
