import { Router } from 'express'
import { signup, signin, me } from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.post('/signup', signup)
router.post('/signin', signin)
router.get('/me', protect, me)

export default router
