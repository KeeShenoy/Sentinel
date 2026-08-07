const redisClient = require("../redis");

async function rateLimiter(req, res, next) {

    try 
    {
        const key = `rate:${req.ip}`;
        const requests = await redisClient.incr(key);

        if (requests === 1) 
        {
            await redisClient.expire(key, 60);
        }

        if (requests > 100) {
            return res.status(429).json({
                message: "Too many requests. Try again later."
            });
        }
        next();
    }

    catch (error) {
        console.error(error);
        next();
    }
}

module.exports = rateLimiter;
