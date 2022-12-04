const ErrorResponse = require("../utils/errorResponse");

exports.errorHandler = (err, req, res, next) => {
  err.statusCode = retrieveStatusCode(err);

  err = handleErrorExceptions(err);

  let jsonResponse = retrieveJsonObject(res, err);

  res.status(err.statusCode || 500).json(jsonResponse);
};

function retrieveJsonObject(response, error) {
  return {
    success: false,
    message: error.message || "Server Error",
    stackTrace: process.env.NODE_ENV === "production" ? null : error.stack,
  };
}

function retrieveStatusCode(error) {
  return error.statusCode ? error.statusCode : 500;
}

function handleErrorExceptions(error) {
  if (error.name === "CastError") {
    let message = `Resource not found with id of ${error.value}`;
    return new ErrorResponse(message, 404);
  } else if (error.code === 11000) {
    let message = `Duplicate field value entered`;
    return new ErrorResponse(message, 400);
  } else if (error.name === "ValidationError") {
    const message = Object.values(error.errors).map(err => err.message);
    return new ErrorResponse(message, 400);
  }
  return error;
}
