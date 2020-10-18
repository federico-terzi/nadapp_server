const Knex = require("knex")
const config = require("config")

const args = process.argv.slice(2)

console.log("using environment", process.env.NODE_ENV)
if (process.env.NODE_ENV !== "development") {
  console.log("avoid using this command in production")
  process.exit(1)
}
const dbConfig = config.get("DBConfig")
console.log(dbConfig)

const knex = Knex(dbConfig)

if (args[0] === "reset") {
  console.log("resetting")
  knex.migrate.rollback(all=true).then(() => {
    console.log("done")
    process.exit(0)
  }).catch(err => console.log(err))
}

if (args[0] === "latest") {
  console.log("migrating latest")
  knex.migrate.latest().then(() => {
    console.log("done")
    process.exit(0)
  }).catch(err => console.log(err))
}

if (args[0] === "seed") {
  console.log("seeding")
  knex.seed.run().then(() => {
    console.log("done")
    process.exit(0)
  }).catch(err => console.log(err))
}