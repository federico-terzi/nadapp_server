import { Model, Modifiers } from 'objection'

export default class Patient extends Model {
  id!: number
  username!: string
  hash!: string
  salt!: string
  firstName!: string
  lastName!: string
  CF!: string
  birthDate!: Date
  telephone!: string

  email?: string
  address?: string
  notes?: string
  

  static tableName = 'patients'

  // Optional JSON schema. This is not the database schema! Nothing is generated
  // based on this. This is only used for validation. Whenever a model instance
  // is created it is checked against this schema. http://json-schema.org/.
  static jsonSchema = {
    type: 'object',
    required: ['firstName', 'lastName', "username", "hash", "salt", "CF", "birthDate", "telephone"],

    properties: {
      id: { type: 'integer' },
      firstName: { type: 'string', minLength: 1, maxLength: 255 },
      lastName: { type: 'string', minLength: 1, maxLength: 255 },
      CF: { type: 'string', minLength: 16, maxLength: 16},
      telephone: { type: 'string', minLength: 1, maxLength: 255 },
      username: { type: 'string', minLength: 1, maxLength: 255 },
      email: { type: 'string', minLength: 1, maxLength: 255 },
      address: { type: 'string', minLength: 1, maxLength: 1024 },
      notes: { type: 'string', minLength: 1, maxLength: 10000 },
      //birthDate: { type: 'date' }, TODO date type
    }
  }
}