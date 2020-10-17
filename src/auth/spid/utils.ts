// Inspired by: https://github.com/pagopa/io-spid-commons/blob/4bdb89dfbc8364813c926e3ee00761a53c892cd5/src/utils/saml.ts#L165

import { DOMParser } from "xmldom"

export const SAML_NAMESPACE = {
  ASSERTION: "urn:oasis:names:tc:SAML:2.0:assertion",
  PROTOCOL: "urn:oasis:names:tc:SAML:2.0:protocol",
  XMLDSIG: "http://www.w3.org/2000/09/xmldsig#"
};

export const getIDFromRequest = (requestXML: string): string | null => {
  const xmlRequest = new DOMParser().parseFromString(requestXML, "text/xml");
  const item = xmlRequest
    .getElementsByTagNameNS(SAML_NAMESPACE.PROTOCOL, "AuthnRequest")
    .item(0)
  if (!item) {
    return null
  }

  return item.getAttribute("ID")
};