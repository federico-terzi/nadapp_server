import {
  withSpid
} from "@pagopa/io-spid-commons";
import { Express } from "express";
import { RedisClient } from "redis";
import {
  spidAppConfig,
  spidAssertionConsumerServiceCallback,
  spidDoneCallback,
  spidLogoutCallback,
  spidSamlConfig,
  spidServiceProviderConfig
} from "../../auth/spid"

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

        // Resolve the promise, so that we can use await to configure SPID
        resolve()
      }).run()
  })
}