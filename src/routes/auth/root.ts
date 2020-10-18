import { Router } from "express"
import basicRoutes from "./basic"

const router = Router()

router.use("/basic", basicRoutes)

// SPID routes are defined in the ./spid.ts module, but differently from the
// rest of the server, as the implementation was dependent on io-spid-commons

export default router