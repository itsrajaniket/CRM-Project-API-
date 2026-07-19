// Standard success response format
const sendSuccess = (res, data = {}, message = 'Operation successful', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message
  });
};

// Standard error response format
const sendError = (res, message = 'An error occurred', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    data: null,
    message
  });
};

module.exports = {
  sendSuccess,
  sendError
};
