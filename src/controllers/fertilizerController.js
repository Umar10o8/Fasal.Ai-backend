import { env } from '../config/env.js'
import { prisma } from '../lib/prisma.js'

// The 19 inputs of the fertilizer model, as fasal.ai-ml/app/schemas.py (FertilizerInput) defines them.
const NUMBER_FIELDS = [
  'Soil_pH',
  'Soil_Moisture',
  'Organic_Carbon',
  'Electrical_Conductivity',
  'Temperature',
  'Humidity',
  'Rainfall',
  'Fertilizer_Used_Last_Season',
  'Yield_Last_Season',
]
const INTEGER_FIELDS = ['Nitrogen_Level', 'Phosphorus_Level', 'Potassium_Level']
const TEXT_FIELDS = [
  'Soil_Type',
  'Crop_Type',
  'Crop_Growth_Stage',
  'Season',
  'Irrigation_Type',
  'Previous_Crop',
  'Region',
]

const ML_TIMEOUT_MS = 15_000

export function validateFertilizerInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Request body must be a JSON object' }
  }

  const data = {}

  for (const field of NUMBER_FIELDS) {
    if (!Number.isFinite(body[field])) return { error: `${field} must be a number` }
    data[field] = body[field]
  }

  for (const field of INTEGER_FIELDS) {
    if (!Number.isInteger(body[field])) return { error: `${field} must be a whole number` }
    data[field] = body[field]
  }

  for (const field of TEXT_FIELDS) {
    const value = typeof body[field] === 'string' ? body[field].trim() : ''
    if (!value) return { error: `${field} is required` }
    data[field] = value
  }

  return { data }
}

/** FastAPI's 422 detail is a list of { loc, msg }; turn it into one readable line. */
function mlErrorMessage(detail) {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((d) => `${d.loc?.at(-1) ?? 'input'}: ${d.msg}`).join('; ')
  }
  return 'Fertilizer model could not process this input'
}

export async function recommendFertilizer(req, res, next) {
  const { data, error } = validateFertilizerInput(req.body)
  if (error) return res.status(400).json({ success: false, message: error })

  let response
  try {
    response = await fetch(`${env.fertilizerMlServiceUrl}/predict/fertilizer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(ML_TIMEOUT_MS),
    })
  } catch (err) {
    console.error('[fertilizer] ML service unreachable:', err.message)
    return res.status(503).json({
      success: false,
      message: 'Fertilizer recommendation service is unavailable. Please try again shortly.',
    })
  }

  try {
    const body = await response.json().catch(() => null)

    if (!response.ok) {
      // Input problems (422/400) are the user's to fix; anything else is ours.
      const status = response.status === 422 || response.status === 400 ? 400 : 502
      return res.status(status).json({
        success: false,
        message: status === 400 ? mlErrorMessage(body?.detail) : 'Fertilizer model failed to respond',
      })
    }

    // Kept for the user's history and Analytics. A failed save never costs them the answer.
    const historyId = await saveRecommendation(req.user.id, data, body)
    res.json({ success: true, data: { ...body, historyId } })
  } catch (err) {
    next(err)
  }
}

async function saveRecommendation(userId, input, result) {
  const top3 = Array.isArray(result?.top3) ? result.top3 : []
  const confidence = top3.find((o) => o.fertilizer === result?.recommended_fertilizer)?.probability ?? top3[0]?.probability
  if (typeof result?.recommended_fertilizer !== 'string' || !Number.isFinite(confidence)) return null
  try {
    const record = await prisma.fertilizerRecommendation.create({
      data: {
        userId,
        input,
        recommended: result.recommended_fertilizer,
        top3,
        confidence,
        crop: input.Crop_Type,
        season: input.Season,
        region: input.Region,
      },
      select: { id: true },
    })
    return record.id
  } catch (err) {
    console.error('[fertilizer] could not save recommendation:', err.message)
    return null
  }
}

const HISTORY_FIELDS = {
  id: true,
  recommended: true,
  confidence: true,
  crop: true,
  season: true,
  region: true,
  createdAt: true,
}

/** GET /api/fertilizer/history?limit=20 → the user's latest recommendations, newest first. */
export async function listFertilizerHistory(req, res, next) {
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 50)
  try {
    const records = await prisma.fertilizerRecommendation.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: HISTORY_FIELDS,
    })
    res.json({ success: true, data: records })
  } catch (err) {
    next(err)
  }
}
