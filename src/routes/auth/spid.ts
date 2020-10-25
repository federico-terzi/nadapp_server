import {
  withSpid
} from "@pagopa/io-spid-commons";
import { Express } from "express";
import { RedisClient } from "redis";
import { HttpError } from "../../../errors";
import { UserInfo } from "../../auth/passport";
import {
  spidAppConfig,
  spidAssertionConsumerServiceCallback,
  spidDoneCallback,
  spidLogoutCallback,
  spidSamlConfig,
  spidServiceProviderConfig
} from "../../auth/spid"
import { del, get } from "../../redis";

export const configureSpid = (app: Express, redisClient: RedisClient): Promise<void> => {
  return new Promise((resolve, reject) => {
    withSpid({
      acs: spidAssertionConsumerServiceCallback,
      app,
      appConfig: spidAppConfig,
      doneCb: spidDoneCallback,
      logout: spidLogoutCallback,
      redisClient,
      samlConfig: spidSamlConfig,
      serviceProviderConfig: spidServiceProviderConfig
    })
      .map(({ app: withSpidApp, idpMetadataRefresher }) => {
        withSpidApp.get(spidAppConfig.clientLoginRedirectionUrl, (_, res) =>
          res.render("spid-redirect-page", {
            message: "Grazie, verrai reindirizzato a breve"
          })
        )
        withSpidApp.get("/spid", (req, res) =>
          res.render("spid-select-page")
        )
        withSpidApp.get(spidAppConfig.clientErrorRedirectionUrl, (req, res) =>
          res.render("spid-redirect-page", {
            message: req.query.errorMessage
          })
        )
        withSpidApp.get("/spid/refresh", async (_, res) => {
          await idpMetadataRefresher().run()
          res.json({
            metadataUpdate: "completed"
          })
        })
        withSpidApp.post(
          '/spid/convertToken',
          async (req, res, next) => {
            try {
              const verificationToken = req.body.token
              if (!verificationToken) {
                throw new HttpError("missing verify params", 400)
              }

              // Get the available data, if present
              const redisPayloadJSON = await get(verificationToken)
              if (!redisPayloadJSON) {
                throw new HttpError("invalid token", 401)
              }

              // Delete used key from store
              await del(verificationToken)

              const redisPayload = JSON.parse(redisPayloadJSON) as UserInfo
              
              req.logIn(redisPayload, err => {
                if (err) { return next(err) }
                res.json({result: "ok"})
              })
            } catch (err) {
              next(err)
            }
          }
        )

        // Resolve the promise, so that we can use await to configure SPID
        resolve()
      }).run()
  })
}