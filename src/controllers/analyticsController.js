import { prisma } from '../lib/prisma.js'

// Same threshold as the Fertilizer page's "low confidence" note.
const LOW_CONFIDENCE = 0.5
const WEEKS = 8
const DAY_MS = 24 * 60 * 60 * 1000

/** Monday 00:00 UTC of the week `date` falls in. */
function weekStart(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return d
}

/**
 * GET /api/analytics/summary → the signed-in user's activity, from their saved
 * fertilizer recommendations: totals, counts per fertilizer and per crop, weekly
 * counts for the last 8 weeks (zero weeks included) and the 5 latest.
 */
export async function getAnalyticsSummary(req, res, next) {
  const userId = req.user.id
  const now = new Date()
  const firstWeek = new Date(weekStart(now).getTime() - (WEEKS - 1) * 7 * DAY_MS)

  try {
    const [stats, lowConfidence, last30Days, byFertilizer, byCrop, recentWeeks, recent] = await Promise.all([
      prisma.fertilizerRecommendation.aggregate({
        where: { userId },
        _count: { _all: true },
        _avg: { confidence: true },
      }),
      prisma.fertilizerRecommendation.count({ where: { userId, confidence: { lt: LOW_CONFIDENCE } } }),
      prisma.fertilizerRecommendation.count({
        where: { userId, createdAt: { gte: new Date(now.getTime() - 30 * DAY_MS) } },
      }),
      prisma.fertilizerRecommendation.groupBy({
        by: ['recommended'],
        where: { userId },
        _count: { _all: true },
        orderBy: { _count: { recommended: 'desc' } },
      }),
      prisma.fertilizerRecommendation.groupBy({
        by: ['crop'],
        where: { userId },
        _count: { _all: true },
        orderBy: { _count: { crop: 'desc' } },
      }),
      prisma.fertilizerRecommendation.findMany({
        where: { userId, createdAt: { gte: firstWeek } },
        select: { createdAt: true },
      }),
      prisma.fertilizerRecommendation.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, recommended: true, confidence: true, crop: true, season: true, region: true, createdAt: true },
      }),
    ])

    const weekly = Array.from({ length: WEEKS }, (_, i) => ({
      weekStart: new Date(firstWeek.getTime() + i * 7 * DAY_MS).toISOString().slice(0, 10),
      count: 0,
    }))
    for (const { createdAt } of recentWeeks) {
      const index = Math.floor((weekStart(createdAt).getTime() - firstWeek.getTime()) / (7 * DAY_MS))
      if (weekly[index]) weekly[index].count += 1
    }

    res.json({
      success: true,
      data: {
        totals: {
          recommendations: stats._count._all,
          last30Days,
          crops: byCrop.length,
          averageConfidence: stats._avg.confidence,
          lowConfidence,
        },
        byFertilizer: byFertilizer.map((row) => ({ fertilizer: row.recommended, count: row._count._all })),
        byCrop: byCrop.map((row) => ({ crop: row.crop, count: row._count._all })),
        weekly,
        recent,
      },
    })
  } catch (err) {
    next(err)
  }
}
