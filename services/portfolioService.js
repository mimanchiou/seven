const PortfolioItem = require('../models/PortfolioItem');
const User = require('../models/User');
const { Op } = require('sequelize');

class PortfolioService {

   /**
   * 根据股票名称计算该股票的总持仓数量
   * @param {string} stockName - 股票名称
   * @returns {Promise<number>} 返回总数量，如果没有记录则返回 0
   */
  async getTotalQuantityByStock(stockName) {
    // 使用 Sequelize 的 aggregate 函数
    const result = await PortfolioItem.sum('quantity', {
      where: {
        stock_name: stockName // 查询条件：stock_name 等于传入的参数
      }
    });

    // 如果没有匹配的记录，`sum` 方法会返回 `null`。
    // 我们将其转换为 0，以便前端处理。
    return result || 0;
  }

  // 买入股票(添加到组合)
  async buyStock(itemData) {
    console.log('Buying stock with data:', itemData);
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
    console.log('Creating portfolio item with data:', itemData.buy_time);
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
  async updatePortfolioItem(id, updateData) {
    // 执行更新，不使用 returning 选项
  const [affectedRows] = await PortfolioItem.update(
    {
      stock_name: updateData.stockName,
      quantity: updateData.quantity,
      buy_price: updateData.currentPrice
    },
    {
      where: { id: id } // 只保留 where 条件
    }
  );

  console.log('受影响的行数:', affectedRows);

  if (affectedRows > 0) {
    // 更新成功后，重新查询获取最新数据
    const updatedItem = await PortfolioItem.findByPk(id);
    return updatedItem;
  } else {
    throw new Error('Portfolio item not found or no changes made');
  }
    /*
    const [updated] = await PortfolioItem.update(data, {
      where: { id }
    });
    
    if (updated) {
      return await this.getPortfolioItemById(id);
    }
    return null;*/
  }

  async sellStock(stockName, sellQuantity, currentPrice) {
    // 1. 根据用户ID和股票名称查询持仓记录
    const portfolioItem = await PortfolioItem.findOne({
      where: {
        stock_name: stockName
      }
    });

    // 验证持仓是否存在
    if (!portfolioItem) {
      throw new Error(`用户未持有 ${stockName} 股票`);
    }

    // 验证卖出数量是否合理
    if (sellQuantity > portfolioItem.quantity) {
      throw new Error(`卖出数量超过持仓数量，当前持仓: ${portfolioItem.quantity}`);
    }

    const userId = 1;

    // 2. 获取用户信息
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 3. 计算收益相关数据
    const buyPrice = portfolioItem.buy_price; // 买入时的价格
    
    const parsedCurrentPrice = parseFloat(currentPrice);
    if (isNaN(parsedCurrentPrice)) {
      throw new Error('卖出价格不是一个有效的数字');
    }

    // 确保 sellQuantity 是一个正整数
    const parsedSellQuantity = parseInt(sellQuantity, 10);
    if (isNaN(parsedSellQuantity) || parsedSellQuantity <= 0) {
      throw new Error('卖出数量必须是一个有效的正整数');
    }
    const sellAmount = parsedCurrentPrice * parsedSellQuantity; // 卖出总金额
    const costAmount = buyPrice * parsedSellQuantity; // 买入时的成本
    const profit = sellAmount - costAmount; // 收益金额
    console.log(`profit: ${profit}, sellAmount: ${sellAmount}, costAmount: ${costAmount}`);

    // 4. 更新持仓记录（部分卖出时）
    if (sellQuantity < portfolioItem.quantity) {
      // 部分卖出：更新剩余数量
      await PortfolioItem.update(
        { quantity: portfolioItem.quantity - sellQuantity },
        { where: { id: portfolioItem.id } }
      );
    } else {
      // 全部卖出：删除持仓记录
      await PortfolioItem.destroy({ where: { id: portfolioItem.id } });
    }

    const userFundsAsNumber = parseFloat(user.total_funds);
    const profitAsNumber = parseFloat(profit); // 如果 profit 也可能是字符串的话

    // 2. 使用转换后的数字进行计算
    const total_funds = userFundsAsNumber + profitAsNumber;

    // 5. 更新用户资金
    //const total_funds = user.total_funds + profit; // 更新总资金
    console.log(`total_funds: ${total_funds}`);
    await User.update(
      {
        available_funds: user.available_funds + sellAmount, // 可用资金增加卖出金额
        invested_funds: user.invested_funds - costAmount, // 投资资金减少成本金额
        total_funds: total_funds // 总资金增加收益
      },
      { where: { id: userId } }
    );

    // 6. 返回交易结果
    return {
      stockName,
      sellQuantity,
      buyPrice,
      sellPrice: currentPrice,
      profit,
      remainingQuantity: sellQuantity < portfolioItem.quantity 
        ? portfolioItem.quantity - sellQuantity 
        : 0
    };
  }
    

  // 卖出股票(从组合中删除)
  /*async sellStock(itemId, sellPrice) {
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
  }*/
 
 async findAndDeleteByStockName(stockName) {
  try {
    // 1. 先查找所有匹配的记录
    const itemsToDelete = await PortfolioItem.findAll({
      where: {
        stock_name: {
          [Op.like]: stockName
        }
      }
    });

    if (itemsToDelete.length === 0) {
      console.log(`未找到名为 "${stockName}" 的持仓记录。`);
      return { success: false, message: '未找到匹配的记录，未执行删除。' };
    }

    // 2. 执行删除操作
    // 你可以遍历后逐个删除，或者一次性删除
    const deletedCount = await PortfolioItem.destroy({
      where: {
        id: itemsToDelete.map(item => item.id) // 根据 id 列表进行精确删除
      }
    });

    console.log(`找到了 ${itemsToDelete.length} 条记录，并成功删除了${deletedCount} 条名为 "${stockName}" 的持仓记录。`);
    return { success: true, message: `成功删除了 ${deletedCount} 条记录。` };

  } catch (error) {
    console.error('查找并删除持仓记录时发生错误:', error);
    return { success: false, message: '删除操作失败，请稍后重试。' };
  }
  }
}

module.exports = new PortfolioService();
