import { Model, Modifiers } from 'objection'

export default class Patient extends Model {
  id!: number
  username!: string
  hash!: string
  firstName!: string
  lastName!: string
  CF!: string
  birthDate!: string 
  telephone!: string
  lastServerEdit!: number

  email?: string
  address?: string
  notes?: string
  
  static tableName = 'patients'
}