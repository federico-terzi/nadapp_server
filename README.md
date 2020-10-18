# nadapp_server

### Getting started

Because the project uses [io-spid-commons](https://github.com/pagopa/io-spid-commons), we need to enable the Github package repository to download the package.

1. Generate a Personal access token on [Github](https://github.com/settings/tokens) and give it `read:packages` permissions.
2. Copy the `.npmrc.example` file to `.npmrc` and insert your token, replacing `TOKEN`.

### Generate SPID test certificate

```
openssl req -x509 -nodes -sha256 -newkey rsa:4096 -keyout ./spid/testcert/key.pem -out ./spid/testcert/cert.pem -days 365
```

### Notes

* The production IDP metadata URL will be: `https://registry.spid.gov.it/metadata/idp/spid-entities-idps.xml`
* Test SPID login URL: `http://localhost:8000/spid/login?entityID=xx_testenv2`