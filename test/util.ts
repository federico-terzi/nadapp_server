import assert from "assert"
import { describe } from "mocha"
import { trimFields } from "../src/util"

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