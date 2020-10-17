// Inspired by https://github.com/pagopa/io-spid-commons/blob/master/src/strategy/redis_cache_provider.ts

import { CacheProvider, SamlConfig } from "passport-saml";
import * as redis from "redis";
import { getIDFromRequest } from "./utils"

export type SAMLRequestCacheItem = {
  RequestXML: string,
  createdAt: Date,
  idpIssuer: string,
};

export interface IExtendedCacheProvider {
  save: (
    RequestXML: string,
    samlConfig: SamlConfig
  ) => Promise<SAMLRequestCacheItem>;
  get: (AuthnRequestID: string) => Promise<SAMLRequestCacheItem>;
  remove: (AuthnRequestID: string) => Promise<string>;
}

// those methods must never fail since there's
// practically no error handling in passport-saml
// (a very bad lot of spaghetti code)
export const noopCacheProvider = (): CacheProvider => {
  return {
    // saves the key with the optional value
    // invokes the callback with the value saved
    save(_, value, callback): void {
      const v = {
        createdAt: new Date(),
        value
      };
      callback(null, v);
    },
    // invokes 'callback' and passes the value if found, null otherwise
    get(_, callback): void {
      callback(null, {});
    },
    // removes the key from the cache, invokes `callback` with the
    // key removed, null if no key is removed
    remove(key, callback): void {
      callback(null, key);
    }
  };
};

export const getExtendedRedisCacheProvider = (
  redisClient: redis.RedisClient,
  // 1 hour by default
  keyExpirationPeriodSeconds: number = 3600 as number,
  keyPrefix: string = "SAML-EXT-"
): IExtendedCacheProvider => {
  return {
    save(
      RequestXML: string,
      samlConfig: SamlConfig
    ): Promise<SAMLRequestCacheItem> {
      
      return new Promise((resolve, reject) => {
        const requestId = getIDFromRequest(RequestXML)
        if (!requestId) {
          return reject(new Error(`SAML#ExtendedRedisCacheProvider: missing AuthnRequest ID`)) 
        }

        if (!samlConfig.idpIssuer) {
          return reject(new Error("Missing idpIssuer inside configuration"))
        }

        const item: SAMLRequestCacheItem = {
          RequestXML,
          createdAt: new Date(),
          idpIssuer: samlConfig.idpIssuer
        };

        redisClient.set(`${keyPrefix}${requestId}`, JSON.stringify(item), "EX", keyExpirationPeriodSeconds, (err, res) => {
          if (err) {
            return reject(new Error(`SAML#ExtendedRedisCacheProvider: set() error ${err}`))
          }

          resolve(item)
        })
      })
    },
    get(AuthnRequestID: string): Promise<SAMLRequestCacheItem> {
      return new Promise((resolve, reject) => {
        redisClient.get(`${keyPrefix}${AuthnRequestID}`, (err, res) => {
          if (err) {
            return reject(new Error(`SAML#ExtendedRedisCacheProvider: get() error ${err}`))
          }

          if (res) {
            const item = JSON.parse(res)
            resolve(item)
          } else {
            reject(new Error(`SAML#ExtendedRedisCacheProvider: get() value not found`))
          }
        })
      })
    },
    remove(AuthnRequestID): Promise<string> {
      return new Promise((resolve, reject) => {
        redisClient.del(`${keyPrefix}${AuthnRequestID}`, (err, res) => {
          if (err) {
            return reject(new Error(`SAML#ExtendedRedisCacheProvider: remove() error ${err}`))
          }
          
          resolve(AuthnRequestID)
        })
      })
    }
  };
};