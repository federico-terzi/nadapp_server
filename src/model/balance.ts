import { Model } from 'objection'

export default class Balance extends Model {
  id!: number
  patientId!: number
  uuid!: string
  date!: Date 
  minPressure!: number
  maxPressure!: number
  heartFrequency!: number
  weight!: number
  diuresis!: number
  osLiquids!: number
  intravenousLiquidsVolume!: number
  
  fecesCount?: number
  fecesTexture?: string
  ostomyVolume?: number
  pegVolume?: number
  otherGastrointestinalLosses?: string
  parenteralNutritionVolume?: number
  otherIntravenousLiquids?: string
  
  static tableName = 'balances'

  syncJson() {
    return {
      uuid: this.uuid,
      date: this.date,
      minPressure: this.minPressure,
      maxPressure: this.maxPressure,
      heartFrequency: this.heartFrequency,
      weight: this.weight,
      diuresis: this.diuresis,
      osLiquids: this.osLiquids,
      intravenousLiquidsVolume: this.intravenousLiquidsVolume,
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