import { Model } from 'objection'
import Patient from './patient'

export default class Doctor extends Model {
  id!: number
  username!: string
  hash!: string
  firstName!: string
  lastName!: string
  telephone!: string
  email!: string
  role!: string
  title?: string
  CF?: string
  publicTelephone?: string
  address?: string
  notes?: string

  static tableName = 'doctors'

  static relationMappings = {
    patients: {
      relation: Model.ManyToManyRelation,
      modelClass: Patient,
      join: {
        from: 'doctors.id',
        through: {
          // authorized_doctors is the join table.
          from: 'authorized_doctors.doctorId',
          to: 'authorized_doctors.patientId'
        },
        to: 'patients.id'
      }
    }
  };

  isAdmin(): boolean {
    if (this.role === "admin") {
      return true
    } else {
      return false
    }
  }

  async canReadPatient(patientId: number) {
    if (this.role === "admin") { // Current doctor is an admin
      return true
    } else if (this.role === "general") { // General medic
      // A general doctor can see the data of the authorized patients
      const knex = Doctor.knex();
      const result = await knex.select("patientId")
        .from("authorized_doctors").where("doctorId", this.id)
        .andWhere("patientId", patientId)
      
      return result.length == 1
    } else {
      throw new Error("invalid doctor role")
    }
  }

  getShortInfo() {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      title: this.title,
      publicTelephone: this.publicTelephone,
      email: this.email,
      address: this.address,
    }
  }
  
  getNameInfo() {
    return {
      id: this.id,
      title: this.title,
      firstName: this.firstName,
      lastName: this.lastName,
    }
  }
}