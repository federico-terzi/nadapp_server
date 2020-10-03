import express, { NextFunction } from "express"
import Knex from "knex";
import { Model } from "objection"
import * as bodyParser from "body-parser"
import KnexConfig from "./knexfile"
import passport from "passport"
import jwt from "jsonwebtoken"
import { Strategy as LocalStrategy } from "passport-local"
import { Strategy as JWTStrategy, ExtractJwt } from "passport-jwt"
import secureRoutes from "./src/routes/secure"
import authRoutes from "./src/routes/auth"
import { configurePassport } from "./src/auth/passport";
import { HttpError } from "./errors";

const PORT = 8000;

// Number of balances to send to the client in case of a sync response
export const MAX_BALANCES_PER_SYNC = 100

// Number of meals to send to the client in case of a sync response
export const MAX_MEALS_PER_SYNC = 100


const knex = Knex(KnexConfig.development)

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

/*
app.get('/movies/:id', async (req,res) => {
    const movie = await Movie.findOne({
        where: {
            id: req.params.id
        }
    });
    if (movie){
        res.json(movie);
    } else {
        res.status(404).send({message: "Movie not found"})
    }
});
*/

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
  
  // TODO: hide in production
  console.log(err);
})

app.listen(PORT, () => {
  console.log(`[server]: Server is running at https://localhost:${PORT}`);
})