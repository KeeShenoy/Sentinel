const generateApiKey = require("../utils/apiKeyGenerator");

const express = require("express");
const router = express.Router();
const pool = require("../db");

const authenticateToken = require("../middleware/auth");
const authorize = require("../middleware/authorize");

router.post(

    "/request",
    authenticateToken,
    authorize("Consumer"),

    async (req, res) => {

        const {
            api_id,
            reason
        } = req.body;

        try {

            const result = await pool.query(

                `INSERT INTO access_requests
                (user_id, api_id, reason)
                VALUES($1,$2,$3)
                RETURNING *`,

                [
                    req.user.id,
                    api_id,
                    reason
                ]

            );
            res.status(201).json({

                message: "Access request submitted.",

                request:
                    result.rows[0]
            });
        }

        catch(error){

            console.error(error);
            res.status(500).json({
                message: "Database Error"
            });
        }
    }
);

router.get(

    "/pending",
    authenticateToken,
    authorize("Admin"),

    async (req,res)=>{

        try{

            const result=await pool.query(

                `SELECT
                    ar.id,
                    u.name,
                    a.name AS api_name,
                    ar.reason,
                    ar.status

                FROM access_requests ar

                JOIN users u
                ON ar.user_id=u.id
                JOIN apis a
                ON ar.api_id=a.id
                WHERE ar.status='Pending'
                ORDER BY ar.id`
            );

            res.json(result.rows);
        }

        catch(error){

            console.error(error);

            res.status(500).json({

                message:"Database Error"

            });
        }
    }
);

router.post(

    "/approve/:id",
    authenticateToken,
    authorize("Admin"),

    async (req, res) => {
        const requestId = req.params.id;

        try {
            // Fetch the access request
            const requestResult = await pool.query(

                `SELECT * FROM access_requests
                 WHERE id = $1`,

                [requestId]
            );

            if (requestResult.rows.length === 0) {
                return res.status(404).json({
                    message: "Access request not found"
                });
            }

            const request = requestResult.rows[0];

            // Prevent approving twice
            if (request.status === "Approved") {
                return res.status(400).json({
                    message: "Request already approved"
                });
            }

            // Generate API key
            const apiKey = generateApiKey();

            // Store API key
            await pool.query(

                `INSERT INTO api_keys
                (api_key, user_id, api_id)

                VALUES($1,$2,$3)`,

                [
                    apiKey,
                    request.user_id,
                    request.api_id
                ]

            );

            // Update request status
            await pool.query(
                `UPDATE access_requests
                SET status='Approved'
                WHERE id=$1`,
                [requestId]
            );

            res.json({
                message: "Access Approved",
                apiKey

            });
        }

        catch(error){

            console.error(error);
            res.status(500).json({
                message:"Database Error"

            });
        }
    }
);


router.get(

    "/my-keys",
    authenticateToken,
    authorize("Consumer"),

    async (req, res) => {

        try {
            const result = await pool.query(

                `SELECT
                    ak.api_key,
                    a.name AS api_name,
                    ak.created_at
                 FROM api_keys ak
                 JOIN apis a
                 ON ak.api_id = a.id
                 WHERE ak.user_id = $1
                 ORDER BY ak.id`,

                [
                    req.user.id
                ]
            );
            res.json(result.rows);
        }

        catch(error){
            console.error(error);
            res.status(500).json({
                message:"Database Error"
            });
        }
    }
);

module.exports = router;