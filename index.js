const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3");
const cron = require("node-cron");

const PORT = 3000;
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
    console.error("Error opening database " + err.message);
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
      }
    );
    db.run(
      `CREATE TABLE  IF NOT EXISTS referrals(
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            referrer_id INTEGER NOT NULL,
            referral_id INTEGER NOT NULL,
            is_active INTEGER NOT NULL
        )`,
      (err) => {
        if (err) {
          console.log("Table already exists. ", err);
        }
      }
    );
  }
});

app.get("/api/referrals/", (req, res, next) => {
  const params = [req.params.id];

  db.all("SELECT * FROM referrals", [], (err, referrals) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(200).json(referrals);
  });
});

app.post("/api/referrals/", (req, res, next) => {
  const reqBody = req.body;
  db.run(
    `INSERT INTO referrals (referrer_id, referral_id, is_active) VALUES (?,?,?)`,
    [reqBody.referrer_id, reqBody.referral_id, reqBody.is_active],
    function (err, result) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(201).json({
        referrer_id: this.lastID,
      });
    }
  );
});

app.put("/api/referrals/", (req, res, next) => {
  console.log(req.body);
  const reqBody = req.body;
  db.run(
    `UPDATE referrals set referrer_id = ?, referral_id = ?, is_active = ? WHERE id = ?`,
    [reqBody.referrer_id, reqBody.referral_id, reqBody.is_active, reqBody.id],
    function (err, result) {
      if (err) {
        res.status(400).json({ error: res.message });
        return;
      }
      res.status(200).json(result);
    }
  );
});

app.get("/api/users/:id", (req, res, next) => {
  console.log([req.params.id]);
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
  console.log("put ", req.body);

  const reqBody = req.body;
  db.run(
    `UPDATE users set telegram_username = ?, points = ?, tryCount = ? WHERE telegram_id = ?`,
    [
      reqBody.telegram_username,
      reqBody.points,
      reqBody.tryCount,
      reqBody.telegram_id,
    ]
  );

  db.get(
    `SELECT * FROM users where telegram_id = ?`,
    reqBody.telegram_id,
    (err, row) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(200).json(row);
    }
  );
});

async function start() {
  app.listen(PORT, () =>
    console.log(`App has benn started on port ${PORT}...`)
  );

  cron.schedule("59 23 * * *", function () {
    db.all("SELECT * FROM users", [], (err, users) => {
      if (err) {
        return;
      }
      for (let i = 0; i < users.length; i++) {
        if (users[i].tryCount < 5) {
          db.run(
            `UPDATE users set telegram_username = ?, points = ?, tryCount = ? WHERE telegram_id = ?`,
            [
              users[i].telegram_username,
              users[i].points,
              5,
              users[i].telegram_id,
            ]
          );
        }
      }
    });
  });
}

start();
