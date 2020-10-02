import { Strategy as LocalStrategy } from "passport-local"
import { Strategy as JWTStrategy, ExtractJwt } from "passport-jwt"
import passport from "passport"
import Patient from "../model/patient"
import { HttpError } from "../../errors"

export const configurePassport = () => {
  passport.use("login",
    new LocalStrategy({
      usernameField: 'username',
      passwordField: 'password'
    },
      async (prefixedUser: string, password: string, done: any) => { // TODO: change any
        try {
          const isPatient = prefixedUser.startsWith("patient@");
          const isMed = prefixedUser.startsWith("med@");
          // TODO: test login without category
          if (!isMed && !isPatient) {
            return done(new HttpError("invalid category", 400))
          }

          const tokens = prefixedUser.match(/.*?@(.*)/)
          // TODO: add test
          if (!tokens) {
            return done(new HttpError("bad username format", 400))
          }

          const username: string = tokens[1]
          // TODO: test
          if (!username || username.trim().length == 0) {
            return done(new HttpError("bad username content", 400))
          }

          let user: Patient | null = null // TODO: add med category

          if (isPatient) {
            user = await Patient.query().select().where("username", "=", username).first()
          }
          if (isMed) {
            // TODO
          } 
          
          if (!user) {
            return done(new HttpError("user not found", 403))
          }

          // TODO: validate password
          
          let userData = null

          if (isPatient) {
            userData = {
              patientId: user.id
            }
          } else if (isMed) {
            // TODO
          }

          return done(null, userData)
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
