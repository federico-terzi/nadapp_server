import * as Knex from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex("balances").del();

  // Inserts seed entries
  await knex("balances").insert([
    { 
      id: 1,
      uuid: "279af65a-9702-4f82-9826-0952cf39e122",
      patientId: 1,
      date: "2020-10-15T11:52:20.376Z",
      minPressure: 60,
      maxPressure: 120,
      heartFrequency: 75,
      weight: 86,
      diuresis: 800,
      osLiquids: 50,
      fecesCount: 1,
      fecesTexture: "Formata",
    },
    { 
      id: 2,
      uuid: "bf920384-0da9-4665-8b8c-1e43736ba1cb",
      patientId: 1,
      date: "2020-10-15T11:53:20.376Z",
      minPressure: 64,
      maxPressure: 115,
      heartFrequency: 72,
      weight: 85,
      diuresis: 500,
      fecesCount: 2,
      fecesTexture: "Semi Formata",
      parenteralNutritionVolume: 450,
    },
    { 
      id: 3,
      uuid: "fa71c204-4e4b-44cd-b7c6-964ba1cfa579",
      patientId: 2,
      date: "2020-10-15T11:54:20.376Z",
      minPressure: 62,
      maxPressure: 121,
      heartFrequency: 77,
      weight: 86,
      diuresis: 540,
      fecesCount: 1,
      fecesTexture: "Formata",
    },
    { 
      id: 4,
      uuid: "4f53980d-5bf2-4646-983e-17d5b278f2be",
      patientId: 1,
      date: "2020-10-15T11:55:20.376Z",
      minPressure: 64,
      maxPressure: 115,
    },
    { 
      id: 5,
      uuid: "2991a527-4105-469c-aa51-db2aa0693b8f",
      patientId: 2,
      date: "2020-10-15T11:56:20.376Z",
      minPressure: 61,
    },
  ]);

  // Update the increments counter to avoid this problem: https://github.com/knex/knex/issues/1855
  await knex.raw("SELECT setval('balances_id_seq', (SELECT max(id) FROM balances))")
};
