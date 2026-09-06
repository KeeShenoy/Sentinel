const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
  const header = req.headers.authorization;

  if (!header) return res.sendStatus(401);

  const token = header.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}
module.exports = authenticateToken;
