import { Model } from 'objection'

export default class Meal extends Model {
  id!: number
  patientId!: number
  uuid!: string
  date!: Date 
  meal!: string
  
  static tableName = 'meals'

  getInfo() {
    return {
      uuid: this.uuid,
      date: this.date,
      meal: this.meal,
    }
  }
}