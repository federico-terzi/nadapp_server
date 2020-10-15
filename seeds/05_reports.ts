import * as Knex from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex("reports").del();

  // Reports are added inside tests, as they also require the corresponding files

  // Reset the IDs between tests
  await knex.raw("ALTER SEQUENCE reports_id_seq RESTART WITH 1")
};
