const states = new Map();
function before(apiId, cooldown) {
  const s = states.get(apiId) || {
    state: "CLOSED",
    failures: 0,
    openedAt: 0,
    probe: false,
  };
  if (s.state === "OPEN" && Date.now() - s.openedAt < cooldown)
    return { blocked: true, state: "OPEN" };
  if (s.state === "OPEN") {
    if (s.probe) return { blocked: true, state: "HALF_OPEN" };
    s.state = "HALF_OPEN";
    s.probe = true;
  }
  states.set(apiId, s);
  return { blocked: false, state: s.state };
}
function success(apiId) {
  states.set(apiId, {
    state: "CLOSED",
    failures: 0,
    openedAt: 0,
    probe: false,
  });
}
function failure(apiId, threshold) {
  const s = states.get(apiId) || {
    state: "CLOSED",
    failures: 0,
    openedAt: 0,
    probe: false,
  };
  s.failures++;
  s.probe = false;
  if (s.state === "HALF_OPEN" || s.failures >= threshold) {
    s.state = "OPEN";
    s.openedAt = Date.now();
  }
  states.set(apiId, s);
}
module.exports = { before, success, failure, states };
