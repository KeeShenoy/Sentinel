const express = require("express");
const router = express.Router();
const pool = require("../db");

const authenticateToken = require("../middleware/auth");
const authorize = require("../middleware/authorize");

router.get("/", async (req, res) => {
    try {
        const result = await pool.query(

            `SELECT * FROM apis
             ORDER BY id`
        );

        res.json(result.rows);

    }

    catch (error) {
        console.error(error);

        res.status(500).json({

            message: "Database Error"
        });
    }
});


router.post(

    "/register",
    authenticateToken,
    authorize("Admin"),

    async (req, res) => {

        const {
            name,
            description,
            version
        } = req.body;

        try {
            const adminResult = await pool.query(

                `SELECT name
                 FROM users
                 WHERE id = $1`,
                [req.user.id]

            );

            if (adminResult.rows.length === 0) {

                return res.status(404).json({
                    message: "Admin not found"
                });
            }

            const owner = adminResult.rows[0].name;

            const result = await pool.query(

                `INSERT INTO apis
                (name,description,owner,version)
                VALUES($1,$2,$3,$4)
                RETURNING *`,

                [
                    name,
                    description,
                    owner,
                    version
                ]

            );
            res.status(201).json(result.rows[0]);
        }

        catch (error) {

            console.error(error);
            res.status(500).json({

                message: "Database Error"

            });
        }
    }
);

module.exports = router;