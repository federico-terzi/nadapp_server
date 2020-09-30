import * as Knex from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("users", table => {
    table.increments('id').primary()
    table.string("username").unique()
    table.string("hash")
    table.string("salt")
    table.string("telephone")
    // TODO: finish
  })
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("patients").dropTableIfExists("users")
}

