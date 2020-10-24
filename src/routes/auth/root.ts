import { Router } from "express"
import basicRoutes from "./basic"
import config from "config"

const router = Router()

router.use("/basic", basicRoutes)

// SPID routes are defined in the ./spid.ts module, but differently from the
// rest of the server, as the implementation was dependent on io-spid-commons

router.get("/logout", (req, res, next) => {
  req.logOut()
  res.json({ result: "ok" })
})

// Test endpoints to automatically login a specific user
if (config.util.getEnv("NODE_ENV") === "test") {
  router.post(
    '/testLogin',
    (req, res, next) => {
      req.logIn(req.body, err => {
        if (err) { return next(err) }
        res.json({ result: "ok" })
      })
    }
  )
}

export default router