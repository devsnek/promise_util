const { createPromise, promiseResolve, promiseReject } = process.binding('util');
const { resolve: originalResolve, reject: originalReject } = Promise;
const { setFlagsFromString } = process.binding('v8');

setFlagsFromString('--allow_natives_syntax');
const { PromiseStatus, PromiseResult } = require('./v8');
// compile functions
const pr = Promise.resolve();
PromiseStatus(pr);
PromiseResult(pr);
const re = /^--allow[-_]natives[-_]syntax$/;
if (!process.execArgv.some((s) => re.test(s))) {
  setFlagsFromString('--noallow_natives_syntax');
}

(function binding() {
  if (Promise.create) return;

  Promise.create = createPromise;

  Promise.resolve = function resolve(...args) {
    if (args.length === 2 && args[0] instanceof Promise) {
      return promiseResolve(args[0], args[1]);
    }
    return originalResolve.apply(this, args);
  };

  Promise.reject = function reject(...args) {
    if (args.length === 2 && args[0] instanceof Promise) {
      return promiseReject(args[0], args[1]);
    }
    return originalReject.apply(this, args);
  };

  Object.defineProperties(Promise.prototype, {
    info: { get() { return getPromiseInfo(this); } },
    isResolved: { get() { return this.info.status === 'resolved'; } },
    isRejected: { get() { return this.info.status === 'rejected'; } },
    isPending: { get() { return this.info.status === 'pending'; } },
  });

  Promise.prototype.resolve = function resolve(x) {
    return promiseResolve(this, x);
  };

  Promise.prototype.reject = function reject(x) {
    return promiseReject(this, x);
  };

  Promise.sleep = function sleep(time) {
    const p = Promise.create();
    setTimeout(p.resolve.bind(p), time);
    return p;
  };
  Promise.delay = Promise.sleep;

  Promise.each = function each(input) {
    return new Promise((resolve, reject) => {
      const iterator = input[Symbol.iterator]();
      const resolved = [];
      (function iter() {
        const p = iterator.next();
        if (p.done) return resolve(resolved);
        p.value.then((r) => {
          resolved.push(r);
          iter();
        }, (e) => reject(e));
      }());
    });
  };
}());

function getPromiseInfo(promise) {
  if (!(promise instanceof Promise)) return { status: 'resolved', value: promise };
  let status = PromiseStatus(promise);
  if (status === 'pending') return { status };
  let value = PromiseResult(promise);
  return { status, value };
}

module.exports = getPromiseInfo;
