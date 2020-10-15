import { Model } from 'objection'

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

  static get modelPaths() {
    return [__dirname];
  }

  static get relationMappings() {
    // Use require to avoid circular dependency
    // See: https://vincit.github.io/objection.js/guide/relations.html#require-loops
    return {
      doctors: {
        relation: Model.ManyToManyRelation,
        modelClass: "Doctor",
        join: {
          from: 'patients.id',
          through: {
            // authorized_doctors is the join table.
            from: 'authorized_doctors.patientId',
            to: 'authorized_doctors.doctorId'
          },
          to: 'doctors.id'
        }
      }
    }
  };

  getLastServerEditTimestamp(): number {
    return this.lastServerEdit.getTime()
  }

  getShortInfo() {
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