import { Model } from 'objection'

export default class Report extends Model {
  id!: number
  patientId!: number
  date!: Date 
  location!: string
  iv!: string
  key!: string
  
  static tableName = 'reports'

  getInfo() {
    return {
      id: this.id,
      date: this.date,
    }
  }

  getIVKey(): [iv: Buffer, key: Buffer] {
    const ivBuffer = Buffer.from(this.iv, "base64")
    const keyBuffer = Buffer.from(this.key, "base64")
    return [ivBuffer, keyBuffer]
  }
}