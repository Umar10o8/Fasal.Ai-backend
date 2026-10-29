import { Router } from 'express'
import { requireSession } from '../middleware/requireSession.js'
import { listFertilizerHistory, recommendFertilizer } from '../controllers/fertilizerController.js'

const router = Router()

router.use(requireSession)

// Forwards to the Python ML service (FERTILIZER_ML_SERVICE_URL) and relays its prediction.
router.post('/', recommendFertilizer)

// The user's saved recommendations, newest first.
router.get('/history', listFertilizerHistory)

export default router
