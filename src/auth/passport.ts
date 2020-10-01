import { Strategy as LocalStrategy } from "passport-local"
import { Strategy as JWTStrategy, ExtractJwt } from "passport-jwt"
import passport from "passport"
import Patient from "../model/Patient"
import { HttpError } from "../../errors"

export const configurePassport = () => {
  passport.use("login",
    new LocalStrategy({
      usernameField: 'username',
      passwordField: 'password'
    },
      async (username: string, password: string, done: any) => { // TODO: change any
        try {
          const user = await Patient.query().select().where("username", "=", username).first()
          
          if (!user) {
            return done(new HttpError("user not found", 403));
          }

          // TODO: validate password
          
          return done(null, {
            name: user.firstName,
          })
          /*
          const user = await UserModel.findOne({ email });
    
          if (!user) {
            return done(null, false, { message: 'User not found' });
          }
    
          const validate = await user.isValidPassword(password);
    
          if (!validate) {
            return done(null, false, { message: 'Wrong Password' });
          }
    
          return done(null, user, { message: 'Logged in Successfully' });
          */
        } catch (error) {
          return done(error);
        }
      }
    ))

  passport.use(
    new JWTStrategy(
      {
        secretOrKey: 'TOP_SECRET',  // TODO: change secret
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
