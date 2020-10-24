import config from "config"
import redis from "redis"
import util from "util"

const redisConfig = config.get("RedisConfig") as {
  host: string,
  port: number,
}

export const redisClient = redis.createClient({
  host: redisConfig.host,
  port: redisConfig.port,
})

redisClient.on('error', console.error)

export const flushall = util.promisify(redisClient.flushall).bind(redisClient)
export const set = (key: string, value: string, mode: string, duration: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    redisClient.set(key, value, mode, duration, (err, reply) => {
      if (err) {
        return reject(err)
      }
      resolve(reply)
    })
  })
}
export const get = util.promisify(redisClient.get).bind(redisClient)
export const del = (key: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    redisClient.del(key, (err, reply) => {
      if (err) {
        return reject(err)
      }
      resolve(reply)
    })
  })
}