// models/ApiResponse.js
class ApiResponse {
  constructor(code, success, message, data) {
    this.code = code;
    this.success = success;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().getTime();
  }

  static success(data, message = '操作成功') {
    return new ApiResponse(200, true, message, data);
  }

  static error(code = 500, message = '服务器内部错误') {
    return new ApiResponse(code, false, message, null);
  }

  static notFound(message = '资源未找到') {
    return new ApiResponse(404, false, message, null);
  }

  static badRequest(message = '参数错误') {
    return new ApiResponse(400, false, message, null);
  }

  static unauthorized(message = '未授权') {
    return new ApiResponse(401, false, message, null);
  }

  static forbidden(message = '禁止访问') {
    return new ApiResponse(403, false, message, null);
  }
}

module.exports = ApiResponse;