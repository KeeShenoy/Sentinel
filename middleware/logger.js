const pool = require("../db");

async function logger(req, res, next) {
    res.on("finish", async () => {
        try 
        {
            await pool.query(
                `INSERT INTO request_logs
                (user_id, endpoint, method, status_code)
                VALUES($1,$2,$3,$4)`,
                [
                    req.user ? req.user.id : null,
                    req.originalUrl,
                    req.method,
                    res.statusCode
                ]
            );
        }
        catch(error){
            console.error(error);
        }
    });
    next();
}

module.exports = logger;