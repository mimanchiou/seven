/*const mysql = require('mysql2')
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'stocks' 
});

db.connect((err) => {
    if (err) {
        console.error("Error connecting to the database:", err);
        return;
    }
    console.log("Connected to the MySQL database.");
});
*/
// config/database.js

const { Sequelize } = require('sequelize');

// 从环境变量或配置文件中读取你的数据库连接信息
// 这里使用示例数据
const sequelize = new Sequelize(
  'stocks',  // 数据库名
  'root',       // 用户名
  '123456',       // 密码
  {
    host: 'localhost',   // 数据库主机
    dialect: 'mysql',    // 告诉 Sequelize 使用哪种数据库方言 ('mysql', 'postgres', 'sqlite', 'mariadb', 'mssql')
    logging: console.log // 可选: 在控制台打印生成的SQL语句
  }
);

module.exports = sequelize;


