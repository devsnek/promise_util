/* eslint-disable */

function PromiseStatus(p) {
  return %PromiseStatus(p);
}

function PromiseResult(p) {
  return %PromiseResult(p);
}

module.exports = { PromiseStatus, PromiseResult };
