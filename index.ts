import express, { NextFunction } from "express"
import Knex from "knex";
import { Model } from "objection"
import * as bodyParser from "body-parser"
import passport from "passport"
import secureRoutes from "./src/routes/secure"
import authRoutes from "./src/routes/auth/root"
import { configurePassport, ensureAuthenticated } from "./src/auth/passport"
import { HttpError } from "./errors"
import config from "config"
import fileUpload from "express-fileupload"
import morgan from "morgan"
import { redisClient } from "./src/redis"
import exphbs from "express-handlebars"
import { configureSpid } from "./src/routes/auth/spid"
import session from "express-session"
import connectRedis from "connect-redis"
const RedisStore = connectRedis(session)

const PORT = 8000;

// TODO: move the following two constants to another file
// Number of balances to send to the client in case of a sync response
export const MAX_BALANCES_PER_SYNC = 100

// Number of meals to send to the client in case of a sync response
export const MAX_MEALS_PER_SYNC = 100

const app = express()

export const initializeApp = async (): Promise<express.Express> => {
  console.log("starting with environment:", config.util.getEnv("NODE_ENV"))

  const knex = Knex(config.get("DBConfig"))

  // TODO: improve connection check
  knex.raw('select 1+1 as result').catch(err => {
    console.log(err);
    process.exit(1);
  });

  Model.knex(knex)

  if (config.util.getEnv("NODE_ENV") === "development") {
    app.use(morgan("dev"))
  }

  app.engine('handlebars', exphbs())
  app.set('view engine', 'handlebars')

  app.use(bodyParser.json({
    limit: "50mb",  // TODO: think about reasonable limit
  }))
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(fileUpload({
    abortOnLimit: true,
    limits: { fileSize: 50 * 1024 * 1024 },
  }))
  app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: config.get("SessionSecret"),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.util.getEnv("NODE_ENV") === "production",
    }
  }))

  app.use(passport.initialize())
  app.use(passport.session())

  configurePassport()

  app.use('/api', ensureAuthenticated, secureRoutes)
  app.use('/auth', authRoutes)
  app.use('/static', express.static("public"))
  app.get('/', (req, res) => res.send('NAD-APP Server'))

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

  await configureSpid(app, redisClient)

  app.listen(PORT, () => {
    console.log(`[server]: Server is running at https://localhost:${PORT}`);
  })
  
  return app
}

if (require.main === module) {
  initializeApp()
}