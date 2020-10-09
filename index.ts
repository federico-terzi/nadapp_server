import express, { NextFunction } from "express"
import Knex from "knex";
import { Model } from "objection"
import * as bodyParser from "body-parser"
import passport from "passport"
import secureRoutes from "./src/routes/secure"
import authRoutes from "./src/routes/auth"
import { configurePassport } from "./src/auth/passport"
import { HttpError } from "./errors"
import config from "config"

const PORT = 8000;

// TODO: move the following two constants to another file
// Number of balances to send to the client in case of a sync response
export const MAX_BALANCES_PER_SYNC = 100

// Number of meals to send to the client in case of a sync response
export const MAX_MEALS_PER_SYNC = 100

console.log("starting with environment:", config.util.getEnv("NODE_ENV"))

const knex = Knex(config.get("DBConfig"))

// TODO: improve connection check
knex.raw('select 1+1 as result').catch(err => {
  console.log(err);
  process.exit(1);
});

Model.knex(knex)

const app = express()

configurePassport()

app.use(bodyParser.json({
  limit: "50mb",  // TODO: think about reasonable limit
}))

app.use(passport.initialize())

app.use('/api', passport.authenticate('jwt', { session: false }), secureRoutes)
app.use('/auth', authRoutes)
app.get('/', (req, res) => res.send('Express + TypeScript Server'))

// Handle errors.
app.use((err: any, req: any, res: any, next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status)
    res.json({ error: err.message })
  } else if (err instanceof SyntaxError) {
    res.status(400)
    res.json({ error: "bad json format" })
  } else {
    res.status(err.status || 500)
    res.json({ error: "internal error" })
  }
  
  if (config.get("logErrorsToConsole")) {
    console.log(err);
  }
})

app.listen(PORT, () => {
  console.log(`[server]: Server is running at https://localhost:${PORT}`);
})

export default app