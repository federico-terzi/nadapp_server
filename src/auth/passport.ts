import passport from "passport"
import express from "express"

export interface PatientInfo {
  patientId?: number,
}

export interface DoctorInfo {
  doctorId?: number,
}

export type UserInfo = PatientInfo | DoctorInfo

export const ensureAuthenticated = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.isAuthenticated()) {
    next()
  } else{
    res.sendStatus(401)
  }
}

export const configurePassport = () => {
  passport.serializeUser((user: UserInfo, done) => {
    done(null, user)
  })

  passport.deserializeUser((user: UserInfo, done) => {
    done(null, user)
  })
}
