import { Router } from "express"
import basicRoutes from "./basic"
import spidRoutes from "./spid"

const router = Router()

router.use("/basic", basicRoutes)
router.use("/spid", spidRoutes)

export default router