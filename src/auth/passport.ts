import config from "config"
import passport from "passport"
import { ExtractJwt, Strategy as JWTStrategy } from "passport-jwt"

export const configurePassport = () => {
  passport.use(
    new JWTStrategy(
      {
        secretOrKey: config.get("JWTSecret"),
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
      },
      async (token, done) => {
        try {
          return done(null, token.user);
        } catch (error) {
          done(error);
        }
      }
    )
  )
}
