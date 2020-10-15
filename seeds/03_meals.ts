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
      date: "2020-10-15T11:50:20.376Z",
      meal: "Pasta al pomodoro 100 grammi"
    },
    { 
      id: 2,
      uuid: "be4c5118-432e-4402-b9c0-9db53a64b7e2",
      patientId: 1,
      date: "2020-10-15T11:51:20.376Z",
      meal: "Bistecca di pollo 80 grammi"
    },
    { 
      id: 3,
      uuid: "a514ce42-4b62-4797-a589-36a0bf1571d7",
      patientId: 2,
      date: "2020-10-15T11:52:20.376Z",
      meal: "Riso bollito 70 grammi"
    },
    { 
      id: 4,
      uuid: "a6a12552-f2b8-4453-bc70-c011ad49cd33",
      patientId: 2,
      date: "2020-10-15T11:53:20.376Z",
      meal: "Petto di pollo 50 grammi"
    },
  ]);

  // Update the increments counter to avoid this problem: https://github.com/knex/knex/issues/1855
  await knex.raw("SELECT setval('meals_id_seq', (SELECT max(id) FROM meals))")
};
