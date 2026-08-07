const crypto = require("crypto");
function generateApiKey(prefix = "tm_live") {

    return `${prefix}_${crypto.randomBytes(24).toString("hex")}`;

}

module.exports = generateApiKey;