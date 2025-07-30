const PortfolioItem = require('../models/PortfolioItem');
const User = require('../models/User');

class PortfolioService {
  // 买入股票(添加到组合)
  async buyStock(itemData) {
    //console.log('Buying stock with data:', itemData);
    // 计算总花费
    const totalCost = itemData.buy_price * itemData.quantity;
    //console.log(itemData.user_id, 'available_funds:', totalCost);
    // 检查用户资金是否充足
    const user = await User.findByPk(itemData.user_id);
    //console.log('User found:', user);
    if (!user) {
      throw new Error('用户不存在');
    }
    
    if (user.available_funds < totalCost) {
      throw new Error('可用资金不足');
    }
    
    // 创建股票组合记录
    delete itemData.user_id; // 确保不重复传递
    itemData.buy_time = new Date(); // 设置买入时间为当前时间
    const portfolioItem = await PortfolioItem.create(itemData);
    itemData.user_id = 1; // 恢复 user_id 以便后续使用
    console.log('Portfolio item created:', portfolioItem);
    
    // 更新用户资金
    await User.update({
      available_funds: user.available_funds - totalCost,
      invested_funds: user.invested_funds + totalCost,
      total_funds: user.total_funds // 总资金不变，只是内部转换
    }, {
      where: { id: itemData.user_id }
    });
    
    return portfolioItem;
  }

  // 获取用户的所有股票组合
  async getUserPortfolio(userId) {
    return await PortfolioItem.findAll({
      where: { user_id: userId },
      order: [['buy_time', 'DESC']]
    });
  }

  // 根据ID获取组合项
  async getPortfolioItemById(id) {
    return await PortfolioItem.findByPk(id);
  }

  // 更新组合项(一般不用于更新买入价格，可用于其他字段)
  async updatePortfolioItem(id, data) {
    const [updated] = await PortfolioItem.update(data, {
      where: { id }
    });
    
    if (updated) {
      return await this.getPortfolioItemById(id);
    }
    return null;
  }

  // 卖出股票(从组合中删除)
  async sellStock(itemId, sellPrice) {
    const item = await PortfolioItem.findByPk(itemId);
    if (!item) {
      throw new Error('股票记录不存在');
    }
    
    // 获取用户信息
    const user = await User.findByPk(item.user_id);
    
    // 计算卖出收益
    const totalRevenue = sellPrice * item.quantity;
    
    // 删除组合记录
    await PortfolioItem.destroy({ where: { id: itemId } });
    
    // 更新用户资金
    await User.update({
      available_funds: user.available_funds + totalRevenue,
      invested_funds: user.invested_funds - (item.buy_price * item.quantity),
      total_funds: user.total_funds + (totalRevenue - item.buy_price * item.quantity)
    }, {
      where: { id: item.user_id }
    });
    
    return {
      profit: totalRevenue - (item.buy_price * item.quantity),
      totalRevenue
    };
  }
}

module.exports = new PortfolioService();
