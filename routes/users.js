const express = require("express");
const router = express.Router();

const pool = require("../db");

router.get("/", async (req, res) => {

    try {

        const result = await pool.query(
            "SELECT * FROM users"
        );

        res.json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Database Error"
        });

    }

});

router.post("/", async (req, res) => {

    const { name, email, role } = req.body;

    try {

        const result = await pool.query(

            `INSERT INTO users(name,email,role)
             VALUES($1,$2,$3)
             RETURNING *`,

            [name, email, role]

        );

        res.status(201).json(result.rows[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to create user"
        });

    }

});

module.exports = router;