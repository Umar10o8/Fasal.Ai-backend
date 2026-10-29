import { Router } from 'express'
import { requireSession } from '../middleware/requireSession.js'
import { getWeather } from '../controllers/weatherController.js'

const router = Router()

router.use(requireSession)

// GET /api/weather?city=Lahore → current conditions, 7-day forecast, spray advice and alerts.
router.get('/', getWeather)

export default router
