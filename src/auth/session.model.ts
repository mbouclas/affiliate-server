import {SessionData} from 'express-session'
import { IUserRedisModel } from "~user/user-redis-model";
declare module 'express-session' {
  export interface SessionData {
    id: string;
    user: Partial<IUserRedisModel>;
  }
}
export interface ISessionData extends SessionData {
  id: string;
  user: Partial<IUserRedisModel>;
}
