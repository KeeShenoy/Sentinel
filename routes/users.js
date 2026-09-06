const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");

const authenticateToken = require("../middleware/auth");

const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email, role FROM users");

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Database Error",
    });
  }
});

router.post("/", async (req, res) => {
  const { name, email, role, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users(name, email, role, password)
             VALUES($1, $2, $3, $4)
             RETURNING id, name, email, role`,

      [name, email, role, hashedPassword],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to create user",
    });
  }
});

router.get(
  "/profile",

  authenticateToken,

  async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT id, name, email, role FROM users WHERE id = $1",

        [req.user.id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      res.json({
        message: "Protected Route",

        user: result.rows[0],
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Database Error",
      });
    }
  },
);

module.exports = router;
