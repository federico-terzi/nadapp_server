import { Router } from "express"
import passport from "passport"
import jwt from "jsonwebtoken"
import { HttpError } from "../../../errors";
import config from "config"

const router = Router()

router.post(
  '/login',
  async (req, res, next) => {
    passport.authenticate(
      'login',
      async (err, user, info) => {
        try {
          if (err) {
            return next(err);
          }
          
          if (!user) {
            const error = new HttpError("bad login request", 400);
            return next(error);
          }

          req.login(
            user,
            { session: false },
            async (error) => {
              if (error) return next(error);

              const token = jwt.sign({ user }, config.get("JWTSecret"))

              return res.json({ token });
            }
          );
        } catch (error) {
          return next(error);
        }
      }
    )(req, res, next);
  });

export default router