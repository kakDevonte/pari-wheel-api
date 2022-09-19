const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3");

const PORT = 5000;
const app = express();

app.use(express.json({ extended: true }));
app.use(
  cors({
    credentials: true,
    origin: true,
  })
);

const db = new sqlite3.Database("./wheel_db.db", (err) => {
  if (err) {
    console.error("Erro opening database " + err.message);
  } else {
    db.run(
      `CREATE TABLE  IF NOT EXISTS users(
            telegram_id INTEGER PRIMARY KEY NOT NULL,
            telegram_username TEXT NOT NULL,
            points INTEGER NOT NULL,
            tryCount INTEGER NOT NULL
        )`,
      (err) => {
        if (err) {
          console.log("Table already exists. ", err);
        }
        // let insert =
        //   "INSERT INTO users (telegram_id, telegram_username, points, tryCount) VALUES (?,?,?,?)";
        // db.run(insert, [1234213421, "Devonte", 10, 5]);
      }
    );
  }
});

app.get("/api/users/:id", (req, res, next) => {
  const params = [req.params.id];
  db.get(
    `SELECT * FROM users where telegram_id = ?`,
    [req.params.id],
    (err, row) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(200).json(row);
    }
  );
});

app.get("/api/users", (req, res, next) => {
  db.all("SELECT * FROM users", [], (err, users) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(200).json({ users });
  });
});

app.post("/api/users/", (req, res, next) => {
  const reqBody = req.body;
  db.run(
    `INSERT INTO users (telegram_id, telegram_username, points, tryCount) VALUES (?,?,?,?)`,
    [
      reqBody.telegram_id,
      reqBody.telegram_username,
      reqBody.points,
      reqBody.tryCount,
    ],
    function (err, result) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(201).json({
        telegram_id: this.lastID,
      });
    }
  );
});

app.put("/api/users/", (req, res, next) => {
  const reqBody = req.body;
  db.run(
    `UPDATE users set telegram_username = ?, points = ?, tryCount = ? WHERE telegram_id = ?`,
    [
      reqBody.telegram_username,
      reqBody.points,
      reqBody.tryCount,
      reqBody.telegram_id,
    ],
    function (err, result) {
      if (err) {
        res.status(400).json({ error: res.message });
        return;
      }
      res.status(200).json({ result });
    }
  );
});

async function start() {
  app.listen(PORT, () =>
    console.log(`App has benn started on port ${PORT}...`)
  );
}

start();