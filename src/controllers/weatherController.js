// Weather comes from Open-Meteo (free, no API key). Advice is rule-based on that forecast.
const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const WEATHER_TIMEOUT_MS = 10_000
const CACHE_MS = 10 * 60 * 1000

// Spray and alert thresholds.
const SPRAY_MAX_HUMIDITY = 80
const SPRAY_MAX_WIND_KPH = 20
const SPRAY_MAX_RAIN_CHANCE = 50
const HEAT_C = 40
const FROST_C = 2
const RAIN_LIKELY = 70
const STRONG_WIND_KPH = 40

const cache = new Map()

class WeatherError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

/** WMO weather code → label and the icon name the frontend draws. */
function describeCode(code) {
  if (code === 0) return { condition: 'Clear sky', icon: 'sun' }
  if (code === 1) return { condition: 'Mainly clear', icon: 'sun' }
  if (code === 2) return { condition: 'Partly cloudy', icon: 'cloud-sun' }
  if (code === 3) return { condition: 'Overcast', icon: 'cloud' }
  if (code === 45 || code === 48) return { condition: 'Fog', icon: 'cloud-fog' }
  if (code >= 51 && code <= 57) return { condition: 'Drizzle', icon: 'cloud-drizzle' }
  if (code >= 61 && code <= 67) return { condition: 'Rain', icon: 'cloud-rain' }
  if (code >= 71 && code <= 77) return { condition: 'Snow', icon: 'cloud-snow' }
  if (code >= 80 && code <= 82) return { condition: 'Rain showers', icon: 'cloud-rain' }
  if (code === 85 || code === 86) return { condition: 'Snow showers', icon: 'cloud-snow' }
  if (code >= 95) return { condition: 'Thunderstorm', icon: 'cloud-lightning' }
  return { condition: 'Unknown', icon: 'cloud' }
}

async function getJson(url) {
  let response
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(WEATHER_TIMEOUT_MS) })
  } catch {
    throw new WeatherError(503, 'Weather service is unavailable. Please try again shortly.')
  }
  if (!response.ok) {
    throw new WeatherError(502, 'Weather service returned an error. Please try again shortly.')
  }
  return response.json()
}

async function findPlace(city) {
  const params = new URLSearchParams({ name: city, count: '1', language: 'en', format: 'json', countryCode: 'PK' })
  const body = await getJson(`${GEOCODE_URL}?${params}`)
  const place = body.results?.[0]
  if (!place) throw new WeatherError(404, `We couldn't find "${city}" in Pakistan. Check the spelling.`)
  return place
}

async function getForecast(place) {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,uv_index,visibility',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max',
    timezone: 'auto',
    forecast_days: '7',
  })
  return getJson(`${FORECAST_URL}?${params}`)
}

function dayLabel(date) {
  // Dates are local to the place ("2026-10-28"); read them as UTC so the weekday doesn't shift.
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

function sprayAdvice(current, today) {
  const reasons = []
  // Stable ids beside the English text, so clients can show the reasons in their own language.
  const reasonIds = []
  if (current.humidity >= SPRAY_MAX_HUMIDITY) {
    reasonIds.push('humidity')
    reasons.push(`Humidity ${current.humidity}% is at or above ${SPRAY_MAX_HUMIDITY}%, so spray may not dry on the leaves.`)
  }
  if (current.windKph >= SPRAY_MAX_WIND_KPH) {
    reasonIds.push('wind')
    reasons.push(`Wind ${current.windKph} km/h is at or above ${SPRAY_MAX_WIND_KPH} km/h, so spray may drift.`)
  }
  if (today && today.rainChance >= SPRAY_MAX_RAIN_CHANCE) {
    reasonIds.push('rain')
    reasons.push(`${today.rainChance}% chance of rain today, which may wash the spray off.`)
  }
  return { safe: reasons.length === 0, reasons, reasonIds }
}

/**
 * The first day each risk appears in the forecast, with its worst value over the week.
 * `value` is the number in the description (°C, %, km/h), for clients that word it themselves.
 */
function weatherAlerts(current, daily) {
  const alerts = []
  const first = (test) => daily.find(test)

  const hot = first((d) => d.high >= HEAT_C)
  if (hot) {
    const peak = Math.max(...daily.map((d) => d.high))
    alerts.push({
      id: 'heat',
      value: peak,
      severity: 'red',
      title: 'Heatwave warning',
      description: `Temperatures up to ${peak}°C expected. Irrigate in the early morning or evening and watch for heat stress.`,
      date: hot.date,
    })
  }

  const frost = first((d) => d.low <= FROST_C)
  if (frost) {
    const lowest = Math.min(...daily.map((d) => d.low))
    alerts.push({
      id: 'frost',
      value: lowest,
      severity: 'red',
      title: 'Frost risk',
      description: `Night temperatures down to ${lowest}°C expected. Light irrigation in the evening can protect young crops.`,
      date: frost.date,
    })
  }

  const rain = first((d) => d.rainChance >= RAIN_LIKELY)
  if (rain) {
    alerts.push({
      id: 'rain',
      value: rain.rainChance,
      severity: 'amber',
      title: 'Rain likely',
      description: `${rain.rainChance}% chance of rain on ${dayLabel(rain.date)}. Hold irrigation and avoid spraying before it.`,
      date: rain.date,
    })
  }

  const windy = first((d) => d.windMaxKph >= STRONG_WIND_KPH)
  if (windy) {
    const peak = Math.max(...daily.map((d) => d.windMaxKph))
    alerts.push({
      id: 'wind',
      value: peak,
      severity: 'amber',
      title: 'Strong winds',
      description: `Wind up to ${peak} km/h from ${dayLabel(windy.date)}. Support tall crops and postpone spraying.`,
      date: windy.date,
    })
  }

  if (current.humidity >= SPRAY_MAX_HUMIDITY) {
    alerts.push({
      id: 'humidity',
      value: current.humidity,
      severity: 'amber',
      title: 'High humidity',
      description: `Humidity is ${current.humidity}%. Fungal disease risk is higher, so check leaves for spots or mould.`,
      date: daily[0]?.date,
    })
  }

  if (alerts.length === 0) {
    alerts.push({
      id: 'clear',
      severity: 'green',
      title: 'No weather risks',
      description: 'No heat, frost, heavy rain or strong wind expected in the next 7 days.',
      date: daily[0]?.date,
    })
  }

  return alerts.map((alert) => ({ ...alert, dateLabel: alert.date ? dayLabel(alert.date) : '' }))
}

async function buildWeather(city) {
  const place = await findPlace(city)
  const forecast = await getForecast(place)
  const c = forecast.current
  const d = forecast.daily

  const current = {
    temp: Math.round(c.temperature_2m),
    humidity: Math.round(c.relative_humidity_2m),
    windKph: Math.round(c.wind_speed_10m),
    uvIndex: Math.round(c.uv_index),
    visibilityKm: Math.round(c.visibility / 1000),
    ...describeCode(c.weather_code),
  }

  const daily = d.time.map((date, i) => ({
    date,
    high: Math.round(d.temperature_2m_max[i]),
    low: Math.round(d.temperature_2m_min[i]),
    // null when the model has no rain estimate for that day
    rainChance: d.precipitation_probability_max[i] ?? null,
    windMaxKph: Math.round(d.wind_speed_10m_max[i]),
    ...describeCode(d.weather_code[i]),
  }))

  return {
    location: {
      name: place.name,
      region: place.admin1 || '',
      country: place.country || '',
      latitude: place.latitude,
      longitude: place.longitude,
    },
    current,
    daily,
    spray: sprayAdvice(current, daily[0]),
    alerts: weatherAlerts(current, daily),
    source: 'Open-Meteo',
    updatedAt: c.time,
  }
}

export async function getWeather(req, res, next) {
  const city = typeof req.query.city === 'string' ? req.query.city.trim() : ''
  if (!city || city.length > 80) {
    return res.status(400).json({ success: false, message: 'Enter a city name' })
  }

  const key = city.toLowerCase()
  const cached = cache.get(key)
  if (cached && cached.expires > Date.now()) {
    return res.json({ success: true, data: cached.data })
  }

  try {
    const data = await buildWeather(city)
    cache.set(key, { data, expires: Date.now() + CACHE_MS })
    return res.json({ success: true, data })
  } catch (err) {
    if (err instanceof WeatherError) {
      return res.status(err.status).json({ success: false, message: err.message })
    }
    return next(err)
  }
}
