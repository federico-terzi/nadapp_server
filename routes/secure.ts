import { Router } from "express"

const router = Router()

router.get(
  '/sync',
  (req, res, next) => {
    res.json({
      message: 'You made it to the secure route',
      user: req.user,
    })
  }
);

export default router