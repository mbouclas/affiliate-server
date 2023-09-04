import { Controller, Get, Param, Req } from "@nestjs/common";
import { Request } from "express";
import { PreviewsService } from "~root/previews/previews.service";
import { CouldNotStartPreviewServerException } from "~root/previews/exceptions/CouldNotStartPreviewServer.exception";
import {
  CouldNotGeneratePreviewUrlHttpException
} from "~root/previews/exceptions/CouldNotGeneratePreviewUrlHttp.exception";
import { McmsDiContainer } from "~helpers/mcms-component.decorator";
import { CouldNotDumpDataHttpException } from "~root/previews/exceptions/CouldNotDumpDataHttp.exception";

@Controller('api/previews')
export class PreviewsController {
  @Get('getUrl/:module/:type/:id')
  async preview(@Req() req: Request, @Param('module') module: string, @Param('id') itemId: string,  @Param('type') type: 'item'|'category') {
    const appName = req.header('x-app-name');
    const container = McmsDiContainer.get({id: `${module}Service`});
    const service = new container.reference(appName) as any;
    const item = await service.findOne({id: itemId});

    try {
      const url = await new PreviewsService(appName).generatePreviewUrl(module, type, item, false);

      return {url};
    }
    catch (e) {
      console.log(e)
      throw new CouldNotGeneratePreviewUrlHttpException(e.message);
    }
  }

  @Get('dumpData')
  async dumpData(@Req() req: Request) {
    const appName = req.header('x-app-name');
    try {
      await new PreviewsService(appName).dumpData();
      return {success: true};
    }
    catch (e) {
      throw new CouldNotDumpDataHttpException(e.message);
    }
  }
}
