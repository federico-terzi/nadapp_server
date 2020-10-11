import config from "config"
import Knex from "knex"
import { Model } from "objection"
import app from "../.."

// This module is executed before the nested ones, making it possible
// to run a seed+clean up step between tests, so that each test runs
// on a clean database

const knex = Knex(config.get("DBConfig"))

Model.knex(knex)

// Make sure we are in the testing environment before destroying the database
if (config.util.getEnv("NODE_ENV") !== "test") {
  throw new Error("Attempting to run tests in a non-test environment. Currently in " + config.util.getEnv("NODE_ENV"))
}

if ((config.get("DBConfig") as any).connection.user !== "testpostgres") {
  throw new Error("Attempt to run tests with a non test user. Are you sure you are connecting to the right database?")
}

before(async () => {
  console.log("Deleting all database data to start from a clean state");
  await knex.raw("drop schema public cascade")
  await knex.raw("create schema public")
  await knex.raw("ALTER SCHEMA public OWNER to testpostgres")
  console.log("Run the migrations")
  // Run migrations
  await knex.migrate.latest()
})

beforeEach(async () => {
  // Delete the previous data and populate the db with a fresh copy
  await knex.seed.run()
})

after(() => {
  // Release the connection to allow mocha to exit
  knex.destroy()
})