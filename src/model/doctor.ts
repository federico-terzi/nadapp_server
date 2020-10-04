import { AbilityBuilder } from '@casl/ability'
import { Model } from 'objection'
import { NadAbility } from '../abilities'
import Patient from './patient'

export default class Doctor extends Model {
  id!: number
  username!: string
  hash!: string
  firstName!: string
  lastName!: string
  birthDate!: Date
  telephone!: string
  email!: string
  role!: string
  title?: string
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
          from: 'authorized_doctors.patientId',
          to: 'authorized_doctors.doctorId'
        },
        to: 'patients.id'
      }
    }
  };

  async getAbilities(): Promise<NadAbility> {
    const { can, cannot, build } = new AbilityBuilder<NadAbility>();

    if (this.role === "admin") { // Current doctor is an admin
      // An admin can create a new patient profile
      can("create", "Patient")

      // An admin can view all patient profiles
      can("read", "Patient")

      // An admin can update patient information
      can("update", "Patient")

      // An admin can create a new doctor profile
      can("create", "Doctor")

      // An admin can view all doctors
      can("read", "Doctor")

      // An admin can update doctor info
      can("update", "Doctor")

      // An admin can authorize a doctor to see a patient profile
      can("authorize", "Doctor")

      // An admin can de-authorize a doctor to see a patient profile
      can("deauthorize", "Doctor")
    } else if (this.role === "general") { // General medic
      // A general doctor can access its own info
      //can("read", "Doctor", { id: this.id })
      //can("update", "Doctor", { id: this.id })

      // A general doctor can see the data of the authorized patients
      // We need to get the list of authorized patients
      const knex = Doctor.knex();
      const authorized: number[] = (await knex.select("patientId")
        .from("authorized_doctors").where("doctorId", this.id)).map(entry => entry.patientId)
      console.log(authorized)
      can("read", "Patient", { id: { $in: authorized } })
    } else {
      throw new Error("invalid doctor role")
    }

    return build()
  }
}