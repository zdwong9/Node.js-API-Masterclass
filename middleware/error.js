exports.errorHandler = (err, req, res, next) => {
  const errorCode = err.statusCode ? err.statusCode : 500;

  console.log(err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Server Error",
    stackTrace: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
