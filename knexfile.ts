export default {
  /*
  development: {
    client: "sqlite3",
    connection: {
      filename: "./dev.sqlite3"
    },
    debug: true,
  },
  */
  /*
  staging: {
    client: "postgresql",
    connection: {
      database: "my_db",
      user: "username",
      password: "password"
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: "knex_migrations"
    }
  },
  */

  
  development: {
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
    },
    migrations: {
      tableName: "knex_migrations"
    },
    debug: true,
  },

  production: {
    client: "postgresql",
    connection: {
      database: "my_db",
      user: "username",
      password: "password"
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: "knex_migrations"
    }
  }

};
