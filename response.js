// middlewares/response.js
const ApiResponse = require('./models/ApiResponse');

module.exports = (req, res, next) => {
  // 添加响应方法到 res 对象
  res.api = {
    success: (data, message) => res.json(ApiResponse.success(data, message)),
    error: (code, message) => res.status(code).json(ApiResponse.error(code, message)),
    notFound: (message) => res.status(404).json(ApiResponse.notFound(message)),
    badRequest: (message) => res.status(400).json(ApiResponse.badRequest(message)),
    unauthorized: (message) => res.status(401).json(ApiResponse.unauthorized(message)),
    forbidden: (message) => res.status(403).json(ApiResponse.forbidden(message))
  };
  
  next();
};