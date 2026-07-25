export function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  })
}

export function errorHandler(err, req, res, next) {
  console.error(err)

  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Email is already registered',
    })
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }

  const status = err.statusCode || 500
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
  })
}
