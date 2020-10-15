import assert from "assert"
import { expect } from "chai"
import { describe } from "mocha"
import { decryptData, encryptData, generateKeyIV, trimFields } from "../src/util"
import fs from "fs"

describe("trim fields", () => {
  it("should trim fields correctly", () => {
    let request = {
      "name": "   hello    ",
      "surname": "\n world\n",
      "number": 1,
    }
    trimFields(request)
    assert.deepStrictEqual(request, {
      name: "hello",
      surname: "world",
      number: 1,
    })
  })
})

describe("encryption methods", () => {
  it("encrypts and decrypts text correctly", () => {
    const [iv, key] = generateKeyIV()
    const text = "plain text"
    const buffer = Buffer.from(text, "utf8")
    const encrypted = encryptData(iv, key, buffer)
    const decrypted = decryptData(iv, key, encrypted)
    const outputText = decrypted.toString("utf8")
    expect(outputText).to.be.eq(text)
  })

  it("encrypts and decrypts a file correctly", () => {
    const [iv, key] = generateKeyIV()
    const data = fs.readFileSync("test/resources/testreport.pdf")
    const encrypted = encryptData(iv, key, data)
    const decrypted = decryptData(iv, key, encrypted)
    expect(decrypted).to.be.deep.eq(data)
  })
})