import { Strategy as LocalStrategy } from "passport-local"
import { Strategy as JWTStrategy, ExtractJwt } from "passport-jwt"
import passport from "passport"

export const configurePassport = () => {
  passport.use("login",
    new LocalStrategy({
      usernameField: 'username',
      passwordField: 'password'
    },
      async (username: string, password: string, done: any) => { // TODO: change any
        try {
          // TODO: change
          if (username == "pippo" && password == "pluto") {
            return done(null, {
              name: "Jerry",
            })
          } else {
            return done(null, false, { message: 'Incorrect credentials' })
          }
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
