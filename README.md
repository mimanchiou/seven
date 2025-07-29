1、用户买入股票接口
  url:（post）http://localhost:8080/portfolio-items/portfolio/buy
  请求参数（json）：
  //注意：前端传过来的参数名要和下面的参数严格一致
  {
  "user_id": 1,
  "stock_name": "GOOGL",
  "buy_time": "2024-07-29 14:30:00",
  "buy_price": 300.50,
  "quantity": 10
  }

2、修改用户资金接口
  url:(put) http://localhost:8080/users/1/funds
  请求参数（json）:
  {
  "total_funds": 50000.00,
  "available_funds": 30000.00,
  "invested_funds": 20000.00
}

3、查询用户的信息
  url:(get) http://localhost:8080/users
  无请求参数
