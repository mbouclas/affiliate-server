import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { SharedModule } from "~shared/shared.module";

@Module({
  imports: [
    SharedModule,
  ],
  providers: [
    ClientService
  ]
})
export class ClientModule {}
