import { Body, Controller, Post, Res, Session } from "@nestjs/common";
import { IsEmail, IsNotEmpty } from "class-validator";
import { AuthService, ILoginResult } from "~root/auth/auth.service";
import { ISessionData } from "~root/auth/session.model";
import { UserService } from "~user/user.service";
import { Request } from "express";
export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}

@Controller('auth')
export class AuthController {
  @Post('login')
  async login(@Body() data: LoginDto, @Session() session: ISessionData) {
    let result: ILoginResult;
    try {
      result = await new AuthService().login(data.email, data.password);
    }
    catch (e) {
      console.log(e)
      return { success: false, message: e.message, code: e.getCode() };
    }


    const user = await new UserService().findOne({email: data.email});

    session.user = AuthService.sanitizeUserModel(user);

    result.sessionId = session.id;
    return {...user, ...result};
  }
}
