import config from "config"
import Knex from "knex"
import { Model } from "objection"
import { initializeApp } from "../.."
import fs from "fs"
import util from "util"
import fsExtra from "fs-extra"
import express from "express"
import { flushall } from "../../src/redis"

const mkdir = util.promisify(fs.mkdir)

export let app: express.Express

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

  // Creating upload destination directory if missing
  if (!fs.existsSync(config.get("uploadDestinationDir"))) {
    await mkdir(config.get("uploadDestinationDir"))
  }

  console.log("initializing the app server")
  app = await initializeApp()
})

beforeEach(async () => {
  // Delete the previous data and populate the db with a fresh copy
  await knex.seed.run()

  // Flush the redis data
  await flushall()
})

after(() => {
  // Release the connection to allow mocha to exit
  knex.destroy()

  // Delete all the temporary uploaded files
  fsExtra.emptyDirSync(config.get("uploadDestinationDir"))
})