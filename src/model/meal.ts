import { Model } from 'objection'

export default class Meal extends Model {
  id!: number
  patientId!: number
  uuid!: string
  date!: string 
  meal!: string
  
  static tableName = 'meals'

  syncJson() {
    return {
      uuid: this.uuid,
      date: this.date,
      meal: this.meal,
    }
  }
}