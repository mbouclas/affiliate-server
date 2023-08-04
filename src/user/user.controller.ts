import { Controller, Get, Query, UseInterceptors, Session, Post, Body, Req } from "@nestjs/common";
import { AppInterceptor } from "~shared/interceptors/app/app.interceptor";
import { ISessionData } from "~root/auth/session.model";
import { IsEmail, IsNotEmpty } from "class-validator";
import { Request } from "express";
import { UserService } from "~user/user.service";
import { AuthorizedUserInterceptor } from "~root/auth/interceptors/authorized-user.interceptor";

export class PostedUserDto {
  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class CreateUserDto extends PostedUserDto {
  @IsNotEmpty()
  password: string;
}

@Controller('api/user')
export class UserController {
  @Get('')
  async find(@Query() queryParams = {}, @Session() session: ISessionData) {
    return []
  }

  @Post('')
  @UseInterceptors(AppInterceptor)
  async store(@Req() req: Request, @Body() data: CreateUserDto) {
    try {
      return await new UserService().store(data);
    }
    catch (e) {
      return { success: false, message: e.message, code: 501 };
    }
  }
}
