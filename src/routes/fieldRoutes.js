import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireSession } from '../middleware/requireSession.js'

const router = Router()

const MAX_AREA = 1_000_000
const MAX_LENGTH = {
  name: 100,
  crop: 60,
  location: 150,
  season: 30,
  notes: 1000,
}

function validateField(body, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Request body must be a JSON object' }
  }

  const data = {}
  const fields = [
    'name',
    'crop',
    'area',
    'areaUnit',
    'location',
    'season',
    'plantingDate',
    'notes',
  ]

  if (partial && !fields.some((field) => Object.hasOwn(body, field))) {
    return { error: 'Provide at least one field to update' }
  }

  for (const field of ['name', 'crop']) {
    if (!partial || Object.hasOwn(body, field)) {
      const value = typeof body[field] === 'string' ? body[field].trim() : ''
      if (!value) return { error: `${field} is required` }
      if (value.length > MAX_LENGTH[field]) {
        return { error: `${field} must be ${MAX_LENGTH[field]} characters or fewer` }
      }
      data[field] = value
    }
  }

  if (!partial || Object.hasOwn(body, 'area')) {
    const area = body.area
    if (!Number.isFinite(area) || area <= 0 || area > MAX_AREA) {
      return { error: `area must be a number greater than 0 and no greater than ${MAX_AREA}` }
    }
    data.area = area
  }

  if (!partial || Object.hasOwn(body, 'areaUnit')) {
    const areaUnit = body.areaUnit ?? 'acre'
    if (!['acre', 'hectare'].includes(areaUnit)) {
      return { error: 'areaUnit must be acre or hectare' }
    }
    data.areaUnit = areaUnit
  }

  for (const field of ['location', 'season', 'notes']) {
    if (Object.hasOwn(body, field)) {
      const value = body[field]
      if (value == null) {
        data[field] = null
        continue
      }
      if (typeof value !== 'string') return { error: `${field} must be a string` }
      const trimmed = value.trim()
      if (trimmed.length > MAX_LENGTH[field]) {
        return { error: `${field} must be ${MAX_LENGTH[field]} characters or fewer` }
      }
      data[field] = trimmed || null
    }
  }

  if (Object.hasOwn(body, 'plantingDate') || !partial) {
    const value = body.plantingDate
    if (value == null || value === '') {
      data.plantingDate = null
    } else if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return { error: 'plantingDate must use YYYY-MM-DD format' }
    } else {
      const plantingDate = new Date(`${value}T00:00:00.000Z`)
      if (
        Number.isNaN(plantingDate.getTime()) ||
        plantingDate.toISOString().slice(0, 10) !== value
      ) {
        return { error: 'plantingDate must be a valid calendar date' }
      }
      data.plantingDate = plantingDate
    }
  }

  return { data }
}

router.use(requireSession)

router.get('/', async (req, res, next) => {
  try {
    const fields = await prisma.fieldRecord.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: { fields } })
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { data, error } = validateField(req.body)
    if (error) return res.status(400).json({ success: false, message: error })

    const field = await prisma.fieldRecord.create({
      data: { ...data, userId: req.user.id },
    })
    res.status(201).json({ success: true, data: { field } })
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const { data, error } = validateField(req.body, true)
    if (error) return res.status(400).json({ success: false, message: error })

    const result = await prisma.fieldRecord.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data,
    })
    if (result.count === 0) {
      return res.status(404).json({ success: false, message: 'Field not found' })
    }

    const field = await prisma.fieldRecord.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    })
    res.json({ success: true, data: { field } })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await prisma.fieldRecord.deleteMany({
      where: { id: req.params.id, userId: req.user.id },
    })
    if (result.count === 0) {
      return res.status(404).json({ success: false, message: 'Field not found' })
    }

    res.json({ success: true, message: 'Field deleted successfully' })
  } catch (err) {
    next(err)
  }
})

export default router
