import Ajv from "ajv"

const patientProperties = {
  firstName: { type: 'string', minLength: 1, maxLength: 255 },
  lastName: { type: 'string', minLength: 1, maxLength: 255 },
  CF: { type: 'string', minLength: 16, maxLength: 16 },
  telephone: { type: 'string', minLength: 1, maxLength: 255 },
  email: { type: 'string', minLength: 1, maxLength: 255 },
  address: { type: 'string', minLength: 1, maxLength: 1024 },
  notes: { type: 'string', minLength: 1, maxLength: 10000 },
  birthDate: { type: 'string', format: "date" },
};

export const addPatientValidator = new Ajv().compile({
  type: 'object',
  required: ['firstName', 'lastName', "CF", "birthDate", "telephone"],
  properties: patientProperties
})

export const editPatientValidator = new Ajv().compile({
  type: 'object',
  properties: patientProperties
})