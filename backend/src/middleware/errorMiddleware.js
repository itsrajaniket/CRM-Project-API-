const { sendError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  // If no status code was set, default to 500
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Log error for dev purposes
  console.error(err.stack);
  
  // Send the standardized error format
  sendError(res, err.message, statusCode);
};

module.exports = { errorHandler };
