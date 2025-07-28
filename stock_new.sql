use stocks;
create table stocks_info(
	stocks_id int auto_increment primary key,
    stocks_name varchar(255) not null
);
create table stocks_detail(
	record_id int auto_increment primary key,
    stocks_info_id int not null comment'stocks_id',
    time_stamp timestamp not null,
    open decimal(10,2),
	high decimal(10,2),
	low decimal(10,2),
	close decimal(10,2),
    quantity int
);
alter table stocks_detail
drop foreign key stocks_detail_ibfk_1;

CREATE TABLE `stocks_detail` (
  `record_id` int NOT NULL AUTO_INCREMENT,
  `stocks_name` int NOT NULL COMMENT 'stocks_id',
  `time_stamp` timestamp NOT NULL,
  `open` decimal(10,2) DEFAULT NULL,
  `high` decimal(10,2) DEFAULT NULL,
  `low` decimal(10,2) DEFAULT NULL,
  `close` decimal(10,2) DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  PRIMARY KEY (`record_id`),
  KEY `stocks_info_id` (`stocks_name`)
) ENGINE=InnoDB AUTO_INCREMENT=937 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_info` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '用户ID，自增主键',
  `username` varchar(50) NOT NULL COMMENT '用户名，唯一不可重复',
  `total_funds` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT '总资金，保留两位小数',
  `available_funds` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT '可用资金（未用于购买股票的资金），保留两位小数',
  `invested_funds` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT '已买入资金（用于购买股票的资金），保留两位小数',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户信息表，存储用户资金相关信息';


CREATE TABLE `user_portfolio_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `stock_name` varchar(220) NOT NULL,
  `buy_time` datetime NOT NULL,
  `buy_price` decimal(10,2) NOT NULL COMMENT '目前可用现金',
  `quantity` int NOT NULL DEFAULT '0' COMMENT '用户买入股票数量',
  PRIMARY KEY (`id`),
  KEY `stock_id` (`stock_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

