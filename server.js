const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = 3000;
const db = mysql.createConnection({
    host: "localhost", 
    user:'root',
    password: 'n3u3da!',
    database:'portfolio'
  });
  db.connect((err) => {
    if (err) {
      console.error("Error connecting to the database:", err);
      return;
    }
      console.log("Connected to the MySQL database.");
  });
  app.use(bodyParser.json());
  app.use(cors());

app.get("/api/portfolio", (req, res) => {
  db.query("SELECT * FROM portfolio", (err, results) => {
    if (err) {
      console.error("Error fetching portfolio data:", err);
      res.status(500).send("Error fetching portfolio data");
      return;
    }
    res.json(results);
  });
});
app.post("/api/portfolio", (req, res) => {
  const newPortfolioItem = req.body;
  db.query("INSERT INTO portfolio SET ?", newPortfolioItem, (err, result) => {
    if (err) {
      console.error("Error adding portfolio item:", err);
      res.status(500).send("Error adding portfolio item");
      return;
    }
    res.status(201).json({ id: result.insertId, ...newPortfolioItem });
  });
});
app.put("/api/portfolio/:id", (req, res) => {
  const id = req.params.id;
  const updatedPortfolioItem = req.body;
  db.query("UPDATE portfolio SET ? WHERE id = ?", [updatedPortfolioItem, id], (err, result) => {
    if (err) {
      console.error("Error updating portfolio item:", err);
      res.status(500).send("Error updating portfolio item");
      return;
    }
    res.json({ id: parseInt(id), ...updatedPortfolioItem });
  });
});
app.delete("/api/portfolio/:id", (req, res) => {
  const id = req.params.id;
  db.query("DELETE FROM portfolio WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("Error deleting portfolio item:", err);
      res.status(500).send("Error deleting portfolio item");
      return;
    }
    res.status(204).send();
  });
});
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});