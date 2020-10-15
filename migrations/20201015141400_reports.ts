import * as Knex from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("reports", table => {
    table.increments('id').primary()
    table.integer("patientId").unsigned()
         .references("id").inTable("patients").onDelete("CASCADE").index()
    table.date("date").notNullable()
    table.string("location").notNullable()
    table.string("iv").notNullable()
    table.string("key").notNullable()
  })
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("reports")
}


