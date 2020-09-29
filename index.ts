import express, { NextFunction } from "express"
import Knex from "knex";
import * as bodyParser from "body-parser"
import { devConnection } from "./db_connection"
import passport from "passport"
import jwt from "jsonwebtoken"
import { Strategy as LocalStrategy } from "passport-local"
import { Strategy as JWTStrategy, ExtractJwt } from "passport-jwt"
import secureRoutes from "./routes/secure"
import authRoutes from "./routes/auth"
import { configurePassport } from "./auth/passport";

const PORT = 8000;

const knex = Knex(devConnection)

// TODO: improve connection check
knex.raw('select 1+1 as result').catch(err => {
  console.log(err);
  process.exit(1);
});

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
  res.status(err.status || 500)
  res.json({ error: err })
})

app.listen(PORT, () => {
  console.log(`[server]: Server is running at https://localhost:${PORT}`);
})