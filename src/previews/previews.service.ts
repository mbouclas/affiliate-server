import { Injectable } from '@nestjs/common';
import { IPreviewServerConfig } from "~root/previews/previews.model";
import { ClientService } from "~root/client/client.service";
import { PreviewServerNotRunningException } from "~root/previews/exceptions/PreviewServerNotRunning.exception";
import type { AxiosResponse } from "axios";
import { SharedModule } from "~shared/shared.module";
import { firstValueFrom, lastValueFrom } from "rxjs";
import { CouldNotStartPreviewServerException } from "~root/previews/exceptions/CouldNotStartPreviewServer.exception";
import { executeOsCommand, executeOsCommandPromise } from "~helpers/execute-os-command";
const { sprintf } = require('sprintf-js');
import { IGenericObject } from "~models/general";

export enum PreviewServerConfigKeys {
  CONFIG_KEY = 'previewServer',
}

@Injectable()
export class PreviewsService {
  config: IPreviewServerConfig;
  constructor(protected appName: string) {
    this.config = ClientService.getConfigProperty(appName, PreviewServerConfigKeys.CONFIG_KEY) as IPreviewServerConfig;
  }

  async pingServer() {
    let res: AxiosResponse<any>;
    try {
      res = await firstValueFrom(
        SharedModule.http.get(this.config.server.baseUrl));
    }
    catch (e) {
      return {status: 0} as AxiosResponse<any>;
    }

    return res;
  }

  async checkIfPreviewServerIsRunning(autoStart = true, dumpData = true) {
    let res: AxiosResponse<any>;
    // ping the preview server
    try {
      res = await this.pingServer();
    }
    catch (e) {

    }

    let isRunning = res.status == 200;

    if (isRunning && dumpData) {
      await this.dumpData();
      return true;
    }

    if (isRunning) {
      return true;
    }

    if (!isRunning && !autoStart) {
      throw new PreviewServerNotRunningException('PREVIEW_SERVER_NOT_RUNNING', '1500.1');
    }

    // try to start the server
    try {
      await this.startPreviewServer();
    }
    catch (e) {
      throw new CouldNotStartPreviewServerException('COULD_NOT_START_PREVIEW_SERVER', '1500.2');
    }

    return true;
  }

  async dumpData() {
    // dump the data to get the latest
    try {
      await executeOsCommandPromise(this.config.server.scripts.dumpData, this.config.server.location, false);
    }
    catch (e) {
      console.log('Error dumping the data',e);
      throw new CouldNotStartPreviewServerException('ERROR_DUMPING_DATA', '1500.3');
    }

    return true;
  }

  async startPreviewServer() {
    await this.dumpData();

    try {
      await executeOsCommand(this.config.server.scripts.dev, this.config.server.location, true);
    }
    catch (e) {
      console.log('Error starting preview server',e);
      throw new CouldNotStartPreviewServerException('COULD_NOT_START_PREVIEW_SERVER', '1500.4');
    }

  }

  async generatePreviewUrl(module: string, type: 'item'|'category' = 'item', item: IGenericObject, dumpData = true) {

    try {
      await this.checkIfPreviewServerIsRunning(true, false);
    }
    catch (e) {
      throw new PreviewServerNotRunningException('PREVIEW_SERVER_NOT_RUNNING', '1500.0');
    }


    // try to generate a new url


    return `${this.config.server.baseUrl}${sprintf(this.config.modules[module].paths[type], item)}`;
  }
}
