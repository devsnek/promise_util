const { createPromise, promiseResolve, promiseReject } = process.binding('util');
const { resolve: originalResolve, reject: originalReject } = Promise;
const Debug = require('vm').runInDebugContext('Debug');

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
  let mirror = Debug.MakeMirror(promise, true);
  if (!mirror.isPromise()) return { status: 'resolved', value: promise };
  let status = mirror.status();
  if (status === 'pending') return { status };
  let value = mirror.promiseValue().value();
  return { status, value };
}

module.exports = getPromiseInfo;
