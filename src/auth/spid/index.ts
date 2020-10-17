import { SpidStrategy } from "./spid";

// TODO: ripartire da qui https://github.com/pagopa/io-spid-commons/blob/17c84ff5664d06f3372fecf11b2c6ed3a0219d2e/src/index.ts
// bisogna creare la strategy e poi tutti gli endpoint

/*
export const getSpidStrategy = (): SpidStrategy => {
  const metadataTamperer = getMetadataTamperer(
    new Builder(),
    serviceProviderConfig,
    samlConfig
  );

  const authorizeRequestTamperer = getAuthorizeRequestTamperer(
    // spid-testenv does not accept an xml header with utf8 encoding
    new Builder({ xmldec: { encoding: undefined, version: "1.0" } }),
    serviceProviderConfig,
    samlConfig
  );
}
*/