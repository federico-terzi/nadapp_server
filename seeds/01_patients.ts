import * as Knex from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex("patients").del();

  // Inserts seed entries
  await knex("patients").insert([
    { 
      id: 1,
      username: "mario.rossi",
      hash: "TOBEDEFINED",
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
      hash: "TOBEDEFINED",
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
      hash: "TOBEDEFINED",
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
};
