// Inspired by https://github.com/pagopa/io-spid-commons/blob/master/src/strategy/saml_client.ts

import * as express from "express";
import { SamlConfig } from "passport-saml";
import * as PassportSaml from "passport-saml";
import { IExtendedCacheProvider } from "./redisCacheProvider";
import {
  PreValidateResponseDoneCallbackT,
  PreValidateResponseT,
  XmlTamperer
} from "./spid";

export class CustomSamlClient extends PassportSaml.SAML {
  constructor(
    private config: SamlConfig,
    private extededCacheProvider: IExtendedCacheProvider,
    private tamperAuthorizeRequest?: XmlTamperer,
    private preValidateResponse?: PreValidateResponseT,
    private doneCb?: PreValidateResponseDoneCallbackT
  ) {
    // validateInResponseTo must be set to false to disable
    // internal cacheProvider of passport-saml
    super({
      ...config,
      validateInResponseTo: false
    });
  }

  /**
   * Custom version of `validatePostResponse` which checks
   * the response XML to satisfy SPID protocol constrains
   */
  public validatePostResponse(
    body: { SAMLResponse: string },
    // tslint:disable-next-line: bool-param-default
    callback: (err: Error, profile?: unknown, loggedOut?: boolean) => void
  ): void {
    if (this.preValidateResponse) {
      return this.preValidateResponse(
        this.config,
        body,
        this.extededCacheProvider,
        this.doneCb,
        (err, isValid, AuthnRequestID) => {
          if (err) {
            return callback(err);
          }
          // go on with checks in case no error is found
          return super.validatePostResponse(body, (error, __, ___) => {
            if (!error && isValid && AuthnRequestID) {
              // tslint:disable-next-line: no-floating-promises
              this.extededCacheProvider
                .remove(AuthnRequestID)
                .then(() => callback(error, __, ___))
                .catch(callback)
            } else {
              callback(error, __, ___);
            }
          });
        }
      );
    }
    super.validatePostResponse(body, callback);
  }

  /**
   * Custom version of `generateAuthorizeRequest` which tampers
   * the generated XML to satisfy SPID protocol constrains
   */
  public generateAuthorizeRequest(
    req: express.Request,
    isPassive: boolean,
    callback: (err: Error, xml?: string) => void
  ): void {
    let newCallback = callback
    if (this.tamperAuthorizeRequest !== undefined) {
      newCallback = (err: Error, xml?: string) => {
        if (xml) {
          this.tamperAuthorizeRequest!(xml).then((tamperedXML) => {
            this.extededCacheProvider.save(tamperedXML, this.config).then(cache => {
              callback((null as unknown) as Error, cache.RequestXML)
            }).catch(err => callback(err))
          }).catch(err => {
            callback(err)
          })
        } else {
          callback(err)
        }
      }
    } 

    super.generateAuthorizeRequest(req, isPassive, newCallback)
  }
}
