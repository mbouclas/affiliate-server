import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { SharedModule } from "~shared/shared.module";
import { OnEvent } from "@nestjs/event-emitter";

@Module({
  imports: [
    SharedModule,
  ],
  providers: [
    ClientService
  ]
})
export class ClientModule {
  @OnEvent('app.loaded')
  async onAppLoaded() {
    const service = new ClientService();
    await service.init();
  }
}
