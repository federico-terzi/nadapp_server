import * as Knex from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("meals", table => {
    table.increments('id').primary()
    table.string("uuid").notNullable()
    table.integer("patientId").unsigned()
         .references("id").inTable("patients").onDelete("CASCADE").index()
    table.dateTime("date").notNullable()
    table.text("meal").notNullable()

    table.unique(["uuid", "patientId"])
  })
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("meals")
}

