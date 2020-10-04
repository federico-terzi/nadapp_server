import { Router } from "express"
import patientRoutes from "./patient"
import medRoutes from "./med";
import adminRoutes from "./med";

const router = Router()

router.use("/patient", patientRoutes)
router.use("/admin", adminRoutes)
router.use("/med", medRoutes)

export default router