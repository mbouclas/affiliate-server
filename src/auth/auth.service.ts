import { Injectable } from '@nestjs/common';
import { compare, genSalt, hash } from "bcryptjs";
import { IUserRedisModel, UserRedisModel } from "~user/user-redis-model";
import { InvalidCredentialsException, UserNotActiveException, UserNotFoundException } from "~root/auth/exceptions";
import {randomBytes} from 'crypto';
import { TokenRedisModel } from "~root/auth/token-redis-model";

export type HashPassword = (
  password: string,
  rounds: number,
) => Promise<string>;

export interface PasswordHasher<T = string> {
  hashPassword(password: T): Promise<T>;
  comparePassword(providedPass: T, storedPass: T): Promise<boolean>;
}

export interface ILoginResult {
  accessToken: string,
  expiresAt: Date,
  email: string,
  sessionId?: string;
}

export function tokenGenerator() {
  return randomBytes(16).toString('hex');
}

export async function hashPassword(
  password: string,
  rounds: number,
): Promise<string> {
  const salt = await genSalt(rounds);
  return await hash(password, salt);
}

export class BcryptHasher implements PasswordHasher<string> {
  constructor(
    private readonly rounds: number
  ) {}

  async hashPassword(password: string): Promise<string> {
    const salt = await genSalt(this.rounds);
    return await hash(password, salt);
  }

  async comparePassword(
    providedPass: string,
    storedPass: string,
  ): Promise<boolean> {
    return  await compare(providedPass, storedPass);

  }

}

@Injectable()
export class AuthService {
  public hasher: BcryptHasher;
  public userModel: UserRedisModel;
  public static defaultTokenExpirationInHours = 24 * 30;

  constructor() {
    this.hasher = new BcryptHasher(10);
    this.userModel = new UserRedisModel();
  }



  async login(email: string, password: string): Promise<ILoginResult> {
    //lookup for the user
    const user = await this.userModel.findOne({email }) as IUserRedisModel;
    console.log('*******', user);
    if (!user) {
      throw new UserNotFoundException('USER_NOT_FOUND', '1500.0' );
    }

    if (typeof user.active === 'undefined' || user.active === false) {
      throw new UserNotActiveException('USER_NOT_ACTIVE', '1500.2')
    }

    const passwordMatched = await this.hasher.comparePassword(password, user.password);
    if (!passwordMatched) {
      throw new InvalidCredentialsException('INVALID_CREDENTIALS', '1500.1');
    }

    const token = tokenGenerator();
    const tokenExpiration = new Date();
    tokenExpiration.setHours(tokenExpiration.getHours() + AuthService.defaultTokenExpirationInHours);

    const tokenModel = new TokenRedisModel();
    const newToken = await tokenModel.add({
      token,
      expiresAt: tokenExpiration,
      userId: user.id,
    }, AuthService.defaultTokenExpirationInHours * 60 * 60);

    return {
      accessToken: newToken.token,
      expiresAt: newToken.expiresAt,
      email: user.email,
    }
  }

  async logout(token: string) {

  }

  static sanitizeUserModel(model: IUserRedisModel) {
    delete model.password;

    return model;
  }

  async validateToken(token: string) {
    const found =  await new TokenRedisModel().findOne({token});
    return !!found;
  }
}
