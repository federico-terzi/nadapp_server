import * as Knex from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex("patients").del();

  // Inserts seed entries
  await knex("patients").insert([
    { 
      id: 1,
      username: "mario.rossi",
      hash: "$2b$11$BEpAnQS.5bGtjZ83Wh2xpuqZub7YKcZmK.eKSSbcOFROylaFSqhZC", // test
      firstName: "Mario",
      lastName: "Rossi",
      CF: "RSSFLV95C12H11UZ",
      birthDate: "1973-04-02",
      telephone: "321123123",
      lastServerEdit: new Date().toISOString(),
      email: "mariorossi@gmail.com",
      address: "Via Spartaco 12, \nBologna",
    },
    { 
      id: 2,
      username: "caterina.verdi",
      hash: "$2b$11$TCHPaJQVxxFD1M2YTtqOTOySwSy1K.cmR0HKZLN8L14pVOWncItxW", // password1234
      firstName: "Caterina",
      lastName: "Verdi",
      CF: "VRDCTR81C12J15KZ",
      birthDate: "1989-10-02",
      telephone: "33112341234",
      lastServerEdit: new Date().toISOString(),
      email: "caterina.verdi@gmail.com",
      address: "Via Bologna 25, \nGenova",
    },
    { 
      id: 3,
      username: "maria.lambertini",
      hash: "$2b$11$S1PlUKkBf5ncH0EyfYTS0ek95VFkR0wUsV3fa5tWuUzmOhvCRxRu.", // Maria.9
      firstName: "Maria",
      lastName: "Lambertini",
      CF: "LMBMRA89E174LSJD2",
      birthDate: "1989-05-10",
      telephone: "3332121999",
      lastServerEdit: new Date().toISOString(),
      email: "maria.lambertini@gmail.com",
      address: "Via Augusti 56, \nNapoli",
    },
  ]);

  // Update the increments counter to avoid this problem: https://github.com/knex/knex/issues/1855
  await knex.raw("SELECT setval('patients_id_seq', (SELECT max(id) FROM patients))")
};
