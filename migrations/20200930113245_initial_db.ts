import * as Knex from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("patients", table => {
    table.increments('id').primary()
    table.string("username").unique().notNullable()
    table.string("hash").notNullable()
    table.string("telephone").notNullable()
    table.string("firstName").notNullable()
    table.string("lastName").notNullable()
    table.timestamp("birthDate").notNullable()
    table.string("email")
    table.string("CF").unique().notNullable()
    table.string("address")
    table.string("notes")
    table.timestamp("lastServerEdit").notNullable()
  })
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("patients")
}

