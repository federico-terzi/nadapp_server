import { Router } from "express"
import mobileRoutes from "./mobile"
import medRoutes from "./med/root";
import adminRoutes from "./admin/root";

const router = Router()

router.use("/mobile", mobileRoutes)
router.use("/admin", adminRoutes)
router.use("/med", medRoutes)

export default router