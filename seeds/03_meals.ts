import * as Knex from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex("meals").del();

  // Inserts seed entries
  await knex("meals").insert([
    { 
      id: 1,
      uuid: "abb7723c-7890-4a4f-8e3d-ed158b2416b5",
      patientId: 1,
      date: new Date().toISOString(),
      meal: "Pasta al pomodoro 100 grammi"
    },
    { 
      id: 2,
      uuid: "be4c5118-432e-4402-b9c0-9db53a64b7e2",
      patientId: 1,
      date: new Date().toISOString(),
      meal: "Bistecca di pollo 80 grammi"
    },
    { 
      id: 3,
      uuid: "a514ce42-4b62-4797-a589-36a0bf1571d7",
      patientId: 2,
      date: new Date().toISOString(),
      meal: "Riso bollito 70 grammi"
    },
  ]);

  // Update the increments counter to avoid this problem: https://github.com/knex/knex/issues/1855
  await knex.raw("SELECT setval('meals_id_seq', (SELECT max(id) FROM meals))")
};
