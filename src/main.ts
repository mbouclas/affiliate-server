import { join, resolve } from "path";

require('dotenv').config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createRedisClient } from "../app.providers";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ValidationPipe } from "@nestjs/common";
const RedisStore = require("connect-redis").default
import * as passport from 'passport';
import flash = require('connect-flash');
import * as session from 'express-session';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
export const projectRoot = resolve(join(__dirname, '../../'));
const viewsDir = resolve(join(__dirname, '../../', 'views'));
const publicDir = resolve(join(__dirname, '../../', 'public'));
const uploadDir = resolve(join(__dirname, '../../', 'upload'));
declare const module: any;

const tokenExpiry = process.env.OAUTH_TOKEN_EXPIRY ? parseInt(process.env.OAUTH_TOKEN_EXPIRY) : 60 * 60 * 23;
const companion = require('@uppy/companion');
const { app: companionApp } = companion.app({
  server: {
    host: process.env.UPPY_SERVER,
    protocol: 'http',
    path: '/companion',
  },
  filePath: uploadDir,
  secret: 'blah blah',
  debug: true,
});
export const redisSessionStore = new RedisStore({ client: createRedisClient(), ttl: tokenExpiry });
export let app: NestExpressApplication;
async function bootstrap() {
  app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
    cors: {
      credentials: true,
      origin: function(origin, callback) {
        if (process.env.ENV === 'development') {
          callback(null, true);
          return;
        }

        if (!origin) {
          callback(null, false);
          return;
        }

        const allow = process.env.ALLOWED_CLIENT_DOMAIN.split(',').some((domain) => {
          return origin.includes(domain);
        });
        callback(null, allow);
      },
      exposedHeaders: ['x-sess-id'],
      maxAge: 2000,
      methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    },
  });

  app.use(compression());
  const oneMonth = 1000 * 60 * 60 * 24 * 30;
  app.use(
    session({
      store: redisSessionStore,
      saveUninitialized: false,
      secret: 'keyboard cat',
      cookie: {
        secure: false,
        path: '/',
        maxAge: oneMonth, //Needs to be in milliseconds
        httpOnly: false,
        sameSite: 'lax',
      },
      name: 'app.sess.id',
      resave: false,
    }),
  );

  app.enable('trust proxy');
  app.useStaticAssets(publicDir);
  app.setBaseViewsDir(viewsDir);

  app.useGlobalPipes(
    new ValidationPipe({
      forbidUnknownValues: false,
    }),
  );

  app.use(cookieParser());
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash());
  app.use('/companion', companionApp)

  const server = await app.listen(process.env.PORT || 3000);
  companion.socket(server);
  console.log(`App is running on port ${process.env.PORT}`);
}

if (process.env.MODE !== 'cli') {
  bootstrap()
    .then(() => {});
}

