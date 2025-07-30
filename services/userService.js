const User = require('../models/User.js');
const { Op } = require('sequelize');

class UserService {
  // 创建新用户
  async createUser(userData) {
    return await User.create(userData);
  }

  // 根据ID获取用户
  async getUserById(id) {
    return await User.findByPk(id);
  }

  // 根据用户名获取用户
  async getUserByUsername(username) {
    return await User.findOne({
      where: { username }
    });
  }

  // 更新用户资金信息
  async updateUserFunds(id, fundsData) {
    // --- 调试日志 ---
    console.log('Attempting to update user with ID:', id);
    console.log('With funds data:', fundsData);
    // --- 调试日志结束 ---
    const [updated] = await User.update(fundsData, {
      where: { id }
    });

    console.log('User updated:', updated);
    
    if (updated) {
      return await this.getUserById(id);
    }
    return null;
  }

  // 获取所有用户
  async getAllUsers() {
    return await User.findAll();
  }

  // 删除用户
  async deleteUser(id) {
    const result = await User.destroy({
      where: { id }
    });
    return result > 0;
  }
}

module.exports = new UserService();
