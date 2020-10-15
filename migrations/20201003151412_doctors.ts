import * as Knex from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("doctors", table => {
    table.increments('id').primary()
    table.string("username").unique().notNullable()
    table.string("hash").notNullable()
    table.string("telephone")
    table.string("title")
    table.string("firstName").notNullable()
    table.string("lastName").notNullable()
    table.string("publicTelephone")
    table.string("CF").unique()
    table.string("email")
    table.string("address")
    table.string("notes")
    table.string("role").notNullable()
  }).createTable("authorized_doctors", table => {
    table.integer("patientId").unsigned()
         .references("id").inTable("patients").onDelete("CASCADE").index()
    table.integer("doctorId").unsigned()
         .references("id").inTable("doctors").onDelete("CASCADE").index()
    table.primary(["patientId", "doctorId"])
  })
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("authorized_doctors")
                    .dropTableIfExists("doctors")
}


