// TODO:
// Useful: https://github.com/pagopa/io-spid-commons/blob/master/src/example.ts
// Useful: https://github.com/pagopa/io-backend/blob/33c172eb381fe04e84bee1afd8d8538241cecfbb/src/config.ts

/*
interface ExternalSPIDConfig {
  privateCertPath: string,
  publicCertPath: string,
  idpMetadataUrl: string,
}

const externalSpidConfig = config.get("SPIDConfig") as ExternalSPIDConfig


export const SpidUser = t.intersection([
  t.interface({
    // the following values may be set
    // by the calling application:
    // authnContextClassRef: SpidLevel,
    // issuer: Issuer
    getAssertionXml: t.Function
  }),
  t.partial({
    fiscalNumber: FiscalCode,
    sessionIndex: t.string
  })
]);

export type SpidUser = t.TypeOf<typeof SpidUser>;

const appConfig: IApplicationConfig = {
  assertionConsumerServicePath: "/spid/acs",
  clientErrorRedirectionUrl: "/spid/error",
  clientLoginRedirectionUrl: "/spid/success",
  loginPath: "/spid/login",
  metadataPath: "/metadata",
  sloPath: "/spid/logout"
};


const serviceProviderConfig: IServiceProviderConfig = {
  IDPMetadataUrl: externalSpidConfig.idpMetadataUrl,
  organization: {
    URL: "https://example.com", // TODO
    displayName: "NAD-APP del Centro IICB Ospedale Sant'Orsola Bologna",
    name: "NAD-APP - Centro IICB"
  },
  publicCert: fs.readFileSync(externalSpidConfig.publicCertPath, "utf-8"),
  requiredAttributes: {
    attributes: [
      "fiscalNumber",
    ],
    name: "Required attrs"
  },
  //spidCieUrl: "https://idserver.servizicie.interno.gov.it:8443/idp/shibboleth",
  spidTestEnvUrl: "http://localhost:8088",
  //spidValidatorUrl: "http://localhost:8080",
  strictResponseValidation: {
    //"http://localhost:8080": true,
    "http://localhost:8088": true
  }
};

// TODO: change the localhost + port to read from configs
const samlConfig: SamlConfig = {
  RACComparison: "minimum",
  acceptedClockSkewMs: 0,
  attributeConsumingServiceIndex: "0",
  authnContext: "https://www.spid.gov.it/SpidL1",
  callbackUrl: "http://localhost:8000" + appConfig.assertionConsumerServicePath,
  // decryptionPvk: fs.readFileSync("./certs/key.pem", "utf-8"),
  identifierFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
  issuer: "https://spid.agid.gov.it/cd",
  logoutCallbackUrl: "http://localhost:8000/spid/slo",
  privateCert: fs.readFileSync(externalSpidConfig.privateCertPath, "utf-8"),
  validateInResponseTo: true
};

const acs: AssertionConsumerServiceT = async payload => {
  console.log("acs:%s", JSON.stringify(payload));
  return ResponsePermanentRedirect({ href: "/success?acs" } as UrlFromString);
};

const logout: LogoutT = async () =>
  ResponsePermanentRedirect({ href: "/success?logout" } as UrlFromString);


const doneCb = (ip: string | null, request: string, response: string) => {
  // tslint:disable-next-line: no-console
  console.log("*************** done", ip);
  // tslint:disable-next-line: no-console
  console.log(request);
  // tslint:disable-next-line: no-console
  console.log(response);
};

export const configureSpid = (app: Express, redisClient: RedisClient): Promise<void> => {
  return new Promise((resolve, reject) => {
    withSpid({
      acs,
      app,
      appConfig,
      doneCb,
      logout,
      redisClient,
      samlConfig,
      serviceProviderConfig
    })
      .map(({ app: withSpidApp, idpMetadataRefresher }) => {
        withSpidApp.get(appConfig.clientLoginRedirectionUrl, (_, res) =>
          res.json({
            success: "success"
          })
        )
        withSpidApp.get(appConfig.clientErrorRedirectionUrl, (_, res) =>
          res
            .json({
              error: "error"
            })
            .status(400)
        )
        withSpidApp.get("/refresh", async (_, res) => {
          await idpMetadataRefresher().run()
          res.json({
            metadataUpdate: "completed"
          })
        })
        
        // Resolve the promise, so that we can use await to configure SPID
        resolve()
      })
  })
}
*/