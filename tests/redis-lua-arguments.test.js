const assert = require("assert");
const source = require("fs").readFileSync("gateway/server.js", "utf8");
assert.match(
  source,
  /redis\.eval\(incrementScript,\{keys:\[String\(key\)\],arguments:\[String\(seconds\)\]\}\)/,
);
console.log("Redis Lua EVAL uses explicit string KEYS and ARGV");
