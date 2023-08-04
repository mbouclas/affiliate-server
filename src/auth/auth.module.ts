import { Module } from '@nestjs/common';
import { GateService } from './gate.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  providers: [GateService, AuthService],
  controllers: [AuthController]
})
export class AuthModule {}
