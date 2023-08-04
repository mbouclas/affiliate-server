import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseInterceptors } from "@nestjs/common";
import { Request } from "express";
import { AppInterceptor } from "~shared/interceptors/app/app.interceptor";
import { BaseScraperService } from "~scrapers/base-scraper.service";
import { IsNotEmpty } from "class-validator";
import { ScraperWorkersService } from "~scrapers/scraper-workers.service";

export class addEntryDto {
  @IsNotEmpty()
  url: string;

  @IsNotEmpty()
  affiliate: string;

}
@Controller('api/scrapers')
export class ScrapersController {
  @Get()
  @UseInterceptors(AppInterceptor)
  async find(@Req() req: Request, @Query('q') qs: string, @Query('limit') limit = 10) {
    const queryParameters = Object.assign({}, req.query);
    const page = req.query.page || 1 as any;
    const appName = req.header('x-app-name');
    return await new BaseScraperService().getList(appName);
  }

  @Post('add-entry')
  @UseInterceptors(AppInterceptor)
  async addEntry(@Req() req: Request, @Body() body: addEntryDto) {

    const appName = req.header('x-app-name');
    return await new BaseScraperService().addToList(appName, body.url, body.affiliate);
  }

  @Post('add-entries')
  @UseInterceptors(AppInterceptor)
  async addEntries(@Req() req: Request, @Body() data: { urls: string[], affiliate: string } ) {

    const appName = req.header('x-app-name');
    return await new BaseScraperService().addMultipleToList(appName, data.urls, data.affiliate);
  }

  @Post('remove-entry')
  @UseInterceptors(AppInterceptor)
  async removeEntry(@Req() req: Request, @Body() body: addEntryDto) {

  }

  @Get(":id/status")
  async getStatus(@Param("id") id: string, @Query("type") type: string = "immediate") {
    try {
      return { status: await (new ScraperWorkersService()).getStatus(id) };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  @Get('active-jobs')
  async getActiveJobs() {
    try {
      return await (new ScraperWorkersService()).getActiveJobs();
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  @Get('history')
  async getHistory(@Query('name') name: string) {
    try {
      return await (new ScraperWorkersService()).getHistory(name);
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  @Get('repeatable-jobs')
  async getRepeatableJobs(@Req() req: Request) {
    try {
      return await (new ScraperWorkersService()).getRepeatableJobs(req.header('x-app-name'));
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  @Get('repeatable-job/:id')
  async getRepeatableJob(@Req() req: Request, @Param('id') id: string) {
    try {
      const res = await (new ScraperWorkersService()).getRepeatableJob({id},req.header('x-app-name'));
      if (!res) {
        return {};
      }

      return res;
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  @Get('failed-jobs')
  async getFailedJobs() {
    try {
      return await (new ScraperWorkersService()).getFailedJobs();
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  @Delete('repeatable-job/:id')
  async removeRepeatableJob(@Req() req: Request, @Param('id') id: string) {
    try {
      return await (new ScraperWorkersService()).removeRepeatableJob({id},req.header('x-app-name'));
    } catch (e) {
      return { success: false, error: e.message, code: 502 };
    }
  }
}
