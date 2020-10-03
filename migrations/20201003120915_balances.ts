import * as Knex from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("balances", table => {
    table.increments('id').primary()
    table.string("uuid").notNullable()
    table.integer("patientId").unsigned()
         .references("id").inTable("patients").onDelete("CASCADE").index()
    table.dateTime("date").notNullable()
    table.integer("minPressure").notNullable()
    table.integer("maxPressure").notNullable()
    table.integer("heartFrequency").notNullable()
    table.double("weight").notNullable()
    table.integer("diuresis").notNullable()
    table.integer("osLiquids").notNullable()
    table.integer("intravenousLiquidsVolume").notNullable()

    table.integer("fecesCount")
    table.string("fecesTexture")
    table.integer("ostomyVolume")
    table.integer("pegVolume")
    table.string("otherGastrointestinalLosses", 512)
    table.integer("parenteralNutritionVolume")
    table.string("otherIntravenousLiquids", 512)

    table.unique(["uuid", "patientId"])
  })
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("balances")
}

