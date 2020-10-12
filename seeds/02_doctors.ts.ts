import * as Knex from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex("doctors").del();
  await knex("authorized_doctors").del();

  // Inserts seed entries
  await knex("doctors").insert([
    { 
      id: 1,
      username: "franco.gialli",
      hash: "TOBEDEFINED",
      firstName: "Franco",
      lastName: "Gialli",
      birthDate: "1986-10-03",
      telephone: "363123123",
      email: "franco.gialli@gmail.com",
      title: "Dott.",
      role: "admin",
    },
    { 
      id: 2,
      username: "carlo.alberti",
      hash: "TOBEDEFINED",
      firstName: "Carlo",
      lastName: "Alberti",
      birthDate: "1976-12-12",
      telephone: "321321231",
      email: "carlo.alberti@gmail.com",
      title: "Dott.",
      publicTelephone: "051235412",
      address: "Via Studio 9\nBologna",
      notes: "Risponde solo il lunedi dalle 15 alle 18",
      role: "general",
    },
  ]);
  await knex("authorized_doctors").insert([
    { 
      doctorId: 2,
      patientId: 2,
    },
    { 
      doctorId: 2,
      patientId: 3,
    },
  ])

  // Update the increments counter to avoid this problem: https://github.com/knex/knex/issues/1855
  await knex.raw("SELECT setval('doctors_id_seq', (SELECT max(id) FROM doctors))")
};
