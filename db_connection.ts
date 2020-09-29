export const devConnection = {
  client: 'postgresql',
  connection: {
    database: 'postgres',
    host: "localhost",
    port: "5432",
    user: "postgres",
    password: "postgres",
  },
  pool: {
    min: 2,
    max: 10
  }
};

/*
  production: {
    client: 'postgresql',
    connection: {
      database: 'example'
    },
    pool: {
      min: 2,
      max: 10
    }
  }
}
*/