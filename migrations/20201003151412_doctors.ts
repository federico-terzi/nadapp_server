import * as Knex from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("doctors", table => {
    table.increments('id').primary()
    table.string("username").unique().notNullable()
    table.string("hash").notNullable()
    table.string("telephone").notNullable()
    table.string("title")
    table.string("firstName").notNullable()
    table.string("lastName").notNullable()
    table.date("birthDate").notNullable()
    table.string("publicTelephone").notNullable()
    table.string("email").notNullable()
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
  return knex.schema.dropTableIfExists("doctors")
                    .dropTableIfExists("authorized_doctors")
}


