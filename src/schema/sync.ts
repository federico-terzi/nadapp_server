import Ajv from "ajv"

export const syncValidator = new Ajv().compile({
  type: 'object',
  required: ["lastServerEdit"],

  properties: {
    lastServerEdit: { type: "integer" },
    meals: {
      type: "array", items: {
        type: "object",
        required: ["uuid", "meal", "date"],
        properties: {
          uuid: { type: "string", minLength: 1, maxLength: 30 },
          meal: { type: "string", minLength: 1 },
          date: { type: "string", format: "date-time" }
        }
      }
    }
  }
})