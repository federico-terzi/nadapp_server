# nadapp_server

### Getting started

Because the project uses [io-spid-commons](https://github.com/pagopa/io-spid-commons) to provide the SPID authentication middleware, we need to compile that first.

```
yarn
yarn global add shx typescript
cd ./node_modules/@pagopa/io-spid-commons
yarn build
```

### Generate SPID test certificate

```
openssl req -x509 -newkey rsa:4096 -keyout ./spid/testcert/key.pem -out ./spid/testcert/cert.pem -days 365
```

### Notes

The production IDP metadata URL will be: `https://registry.spid.gov.it/metadata/idp/spid-entities-idps.xml`