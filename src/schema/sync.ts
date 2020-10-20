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
          uuid: { type: "string", minLength: 1, maxLength: 50 },
          meal: { type: "string", minLength: 1, maxLength: 1024 },
          date: { type: "string" }
        }
      }
    },
    balances: {
      type: "array", items: {
        type: "object",
        required: ["uuid", "date"],
        properties: {
          uuid: { type: "string", minLength: 1, maxLength: 50 },
          date: { type: "string" },
          minPressure: { type: "integer" },
          maxPressure: { type: "integer" },
          heartFrequency: { type: "integer" },
          weight: { type: "number" },
          diuresis: { type: "integer" },
          fecesCount: { type: "integer" },
          fecesTexture: { type: "string", minLength: 1, maxLength: 30 },
          ostomyVolume: { type: "integer" },
          pegVolume: { type: "integer" },
          otherGastrointestinalLosses: { type: "string", minLength: 1, maxLength: 512 },
          parenteralNutritionVolume: { type: "integer" },
          otherIntravenousLiquids: { type: "string", minLength: 1, maxLength: 512 },
          osLiquids: { type: "integer" },
          intravenousLiquidsVolume: { type: "integer" },
        }
      }
    }
  }
})