import { Model } from 'objection'

export default class Balance extends Model {
  id!: number
  patientId!: number
  uuid!: string
  date!: Date 
  
  minPressure?: number
  maxPressure?: number
  heartFrequency?: number
  weight?: number
  diuresis?: number
  osLiquids?: number
  fecesCount?: number
  fecesTexture?: string
  ostomyVolume?: number
  pegVolume?: number
  otherGastrointestinalLosses?: string
  parenteralNutritionVolume?: number
  otherIntravenousLiquids?: string
  
  static tableName = 'balances'

  getInfo() {
    return {
      uuid: this.uuid,
      date: this.date,
      minPressure: this.minPressure ?? undefined,
      maxPressure: this.maxPressure ?? undefined,
      heartFrequency: this.heartFrequency ?? undefined,
      weight: this.weight ?? undefined,
      diuresis: this.diuresis ?? undefined,
      osLiquids: this.osLiquids ?? undefined,
      fecesCount: this.fecesCount ?? undefined,
      fecesTexture: this.fecesTexture ?? undefined,
      ostomyVolume: this.ostomyVolume ?? undefined,
      pegVolume: this.pegVolume ?? undefined,
      otherGastrointestinalLosses: this.otherGastrointestinalLosses ?? undefined,
      parenteralNutritionVolume: this.parenteralNutritionVolume ?? undefined,
      otherIntravenousLiquids: this.otherIntravenousLiquids ?? undefined
    }
  }
}