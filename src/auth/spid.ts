// Inspired by the io-backend and io-spid-commons example
// Useful: https://github.com/pagopa/io-spid-commons/blob/master/src/example.ts
// Useful: https://github.com/pagopa/io-backend/blob/33c172eb381fe04e84bee1afd8d8538241cecfbb/src/config.ts

import {
  AssertionConsumerServiceT,
  IApplicationConfig,
  LogoutT
} from "@pagopa/io-spid-commons";
import { IServiceProviderConfig } from "@pagopa/io-spid-commons/src/utils/middleware";
import config from "config";
import * as fs from "fs";
import * as t from "io-ts";
import { ResponsePermanentRedirect } from "italia-ts-commons/lib/responses";
import {
  FiscalCode
} from "italia-ts-commons/lib/strings";
import { UrlFromString } from "italia-ts-commons/lib/url";
import jwt from "jsonwebtoken";
import { SamlConfig } from "passport-saml";
import Doctor from "../model/doctor";
import Patient from "../model/patient";

interface ExternalSPIDConfig {
  privateCertPath: string,
  publicCertPath: string,
  idpMetadataUrl: string,
}

const externalSpidConfig = config.get("SPIDConfig") as ExternalSPIDConfig

// These callbacks can be used to customize the way the system interacts with SPID

// This callback is invoked after a successful SPID login
export const spidAssertionConsumerServiceCallback: AssertionConsumerServiceT = async payload => {
  // Obtain the user fiscal number
  const rawFiscalNumber: string | undefined = (payload as any).fiscalNumber
  if (!rawFiscalNumber) {
    return ResponsePermanentRedirect({ 
      href: spidAppConfig.clientErrorRedirectionUrl + "?errorMessage=" + encodeURIComponent("codice fiscale non valido") 
    } as UrlFromString)
  }

  // Because fiscal numbers use the format: TINIT-<actual number>, we need to remove the prefix
  const fiscalNumber = rawFiscalNumber.replace("TINIT-", "")

  let userTokenPayload = null

  // First check if the fiscal number belongs to a patient
  const patient = await Patient.query().where("CF", fiscalNumber).first()
  if (patient) {
    userTokenPayload = {
      patientId: patient.id
    }
  } else {
    // Otherwise check if a doctor exists with that fiscal number
    const doctor = await Doctor.query().where("CF", fiscalNumber).first()
    if (doctor) {
      userTokenPayload = {
        doctorId: doctor.id
      }
    }
  }

  if (userTokenPayload === null) {
    return ResponsePermanentRedirect({ 
      href: spidAppConfig.clientErrorRedirectionUrl + "?errorMessage=" + encodeURIComponent("utente non registrato nel sistema") 
    } as UrlFromString)
  }

  // Generate the JWT token
  const token = jwt.sign({ user: userTokenPayload }, config.get("JWTSecret"))
  return ResponsePermanentRedirect({ href: "/spid/success?token="+encodeURIComponent(token)} as UrlFromString);
};

export const spidLogoutCallback: LogoutT = async () =>
  ResponsePermanentRedirect({ href: "/spid/success?logout" } as UrlFromString);


export const spidDoneCallback = (ip: string | null, request: string, response: string) => {
  // TODO: here we should log all the information about the request

  /*
  // tslint:disable-next-line: no-console
  console.log("*************** done", ip);
  // tslint:disable-next-line: no-console
  console.log(request);
  // tslint:disable-next-line: no-console
  console.log(response);
  */
};


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

export const spidAppConfig: IApplicationConfig = {
  assertionConsumerServicePath: "/spid/acs",
  clientErrorRedirectionUrl: "/spid/error",
  clientLoginRedirectionUrl: "/spid/success",
  loginPath: "/spid/login",
  metadataPath: "/metadata",
  sloPath: "/spid/logout"
};


export const spidServiceProviderConfig: IServiceProviderConfig = {
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
export const spidSamlConfig: SamlConfig = {
  RACComparison: "minimum",
  acceptedClockSkewMs: 0,
  attributeConsumingServiceIndex: "0",
  authnContext: "https://www.spid.gov.it/SpidL1",
  callbackUrl: "http://localhost:8000" + spidAppConfig.assertionConsumerServicePath,
  // decryptionPvk: fs.readFileSync("./certs/key.pem", "utf-8"),
  identifierFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
  issuer: "http://localhost:8000/", // https://spid.agid.gov.it/cd
  idpIssuer: "http://localhost:8088/",
  logoutCallbackUrl: "http://localhost:8000/spid/slo",
  privateCert: fs.readFileSync(externalSpidConfig.privateCertPath, "utf-8"),
  validateInResponseTo: true
};