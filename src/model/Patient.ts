import { Model } from 'objection'
import Report from './report'

export default class Patient extends Model {
  id!: number
  username!: string
  hash!: string
  firstName!: string
  lastName!: string
  CF!: string
  birthDate!: Date
  telephone!: string
  lastServerEdit!: Date

  email?: string
  address?: string
  notes?: string
  
  static tableName = 'patients'

  static relationMappings = {
    reports: {
      relation: Model.HasManyRelation,
      modelClass: Report,
      join: {
        from: 'patients.id',
        to: 'reports.patientId'
      }
    }
  };

  getLastServerEditTimestamp(): number {
    return this.lastServerEdit.getTime()
  }

  getShortDescription() {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
    }
  }

  getInfo() {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      CF: this.CF,
      birthDate: this.birthDate,
      telephone: this.telephone,
      email: this.email,
      address: this.address,
      notes: this.notes,
    }
  }
}