export function success(res, data = null, meta = null, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    meta
  });
}