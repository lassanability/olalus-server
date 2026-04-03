exports.validateDashboard = (req, res, next) => {
  const source = req.headers.origin || req.headers.referer || '';

  const allowedOrigins = [process.env.ADMIN_DASHBOARD];
  if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.push('http://localhost:3000', 'http://localhost:3001', 'http://localhost:5300');
  }

  const origins = allowedOrigins.filter(Boolean);
  if (source && origins.length > 0 && !origins.some(allowed => source.startsWith(allowed))) {
    console.warn(`[Dashboard] Blocked request from unauthorized origin: ${source}`);
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  next();
};
