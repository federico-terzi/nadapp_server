import { Model } from 'objection'

export default class Report extends Model {
  id!: number
  patientId!: number
  date!: Date 
  location!: string
  
  static tableName = 'reports'

  getInfo() {
    return {
      id: this.id,
      date: this.date,
    }
  }
}