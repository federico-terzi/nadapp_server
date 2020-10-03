import { Model } from 'objection'

export default class Patient extends Model {
  id!: number
  username!: string
  hash!: string
  firstName!: string
  lastName!: string
  CF!: string
  birthDate!: string 
  telephone!: string
  lastServerEdit!: string

  email?: string
  address?: string
  notes?: string
  
  static tableName = 'patients'

  getLastServerEditTimestamp(): number {
    const date = new Date(this.lastServerEdit)
    return date.getTime()
  }
}