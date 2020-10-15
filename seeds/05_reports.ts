import * as Knex from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex("reports").del();

  // Inserts seed entries
  await knex("reports").insert([
    { 
      id: 1,
      patientId: 1,
      date: "2020-10-15T11:50:20.376Z",
      location: "TODO"
    },
    { 
      id: 2,
      patientId: 3,
      date: "2020-10-15T11:52:20.376Z",
      location: "TODO"
    },
    { 
      id: 3,
      patientId: 3,
      date: "2020-10-15T11:53:20.376Z",
      location: "TODO"
    },
  ]);

  // Update the increments counter to avoid this problem: https://github.com/knex/knex/issues/1855
  await knex.raw("SELECT setval('reports_id_seq', (SELECT max(id) FROM reports))")
};
