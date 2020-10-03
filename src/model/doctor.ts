import { Model } from 'objection'

export default class Doctor extends Model {
  id!: number
  username!: string
  hash!: string
  firstName!: string
  lastName!: string
  birthDate!: string 
  telephone!: string
  email!: string
  title?: string
  publicTelephone?: string
  address?: string
  notes?: string
  
  static tableName = 'doctors'
}