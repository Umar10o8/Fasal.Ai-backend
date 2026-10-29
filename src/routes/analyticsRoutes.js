import { Router } from 'express'
import { requireSession } from '../middleware/requireSession.js'
import { getAnalyticsSummary } from '../controllers/analyticsController.js'

const router = Router()

router.use(requireSession)

// GET /api/analytics/summary → totals, per-fertilizer and per-crop counts, weekly activity, latest 5.
router.get('/summary', getAnalyticsSummary)

export default router
