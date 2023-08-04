import { createClient } from "redis";
import type {RedisClientOptions} from "redis";
const debug = require('debug')('redis');

export function createRedisClient(redisOptions: RedisClientOptions = {}): ReturnType<typeof createClient> {
  if (typeof process.env.REDIS_URL !== 'undefined') {
    redisOptions.url = process.env.REDIS_URL;
  } else {
    redisOptions.url = `redis://:${process.env.REDIS_AUTH}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}${process.env.REDIS_DB ? `/${process.env.REDIS_DB}` : ''}`
  }
  const client = createClient(redisOptions);

  client.connect()
    .then(() => {
      debug('Redis client connected');
    })
    .catch((err) => {
      console.error('Redis client connection error', err);
    });

  client.on('end', () => debug('Redis client disconnected'));
  return client;
}
