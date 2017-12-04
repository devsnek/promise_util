const { resolve: originalResolve, reject: originalReject } = Promise;
const {
  createPromise, promiseResolve, promiseReject,
  getPromiseDetails, kPending, kFulfilled, kRejected,
} = process.binding('util');

const kMounted = Symbol('promise_util.mounted');

function mount(Promise = global.Promise) {
  if (Promise[kMounted])
    return;

  Promise[kMounted] = true;

  Promise.create = createPromise;

  Promise.resolve = function resolve(...args) {
    if (args.length === 2 && args[0] instanceof Promise)
      return promiseResolve(args[0], args[1]);

    return originalResolve.apply(this, args);
  };

  Promise.reject = function reject(...args) {
    if (args.length === 2 && args[0] instanceof Promise)
      return promiseReject(args[0], args[1]);

    return originalReject.apply(this, args);
  };

  Object.defineProperties(Promise.prototype, {
    details: { get() { return getDetails(this); } },
    isResolved: { get() { return getPromiseDetails(this)[0] === kFulfilled; } },
    isRejected: { get() { return getPromiseDetails(this)[0] === kRejected; } },
    isPending: { get() { return getPromiseDetails(this)[0] === kPending; } },
    resolve: { value(x) { return promiseResolve(this, x); } },
    reject: { value(x) { return promiseReject(this, x); } },
  });

  Promise.delay = Promise.sleep = function sleep(time) {
    const p = Promise.create();
    setTimeout(p.resolve.bind(p), time);
    return p;
  };

  Promise.each = function each(input) {
    return new Promise((resolve, reject) => {
      const iterator = input[Symbol.iterator]();
      const resolved = [];
      (function iter() {
        const p = iterator.next();
        if (p.done)
          return resolve(resolved);
        p.value.then((r) => {
          resolved.push(r);
          iter();
        }, (e) => reject(e));
      }());
    });
  };
}

const StateMap = {
  [kPending]: 'pending',
  [kFulfilled]: 'resolved',
  [kRejected]: 'rejected',
};

function getDetails(promise) {
  if (!(promise instanceof Promise))
    return { state: StateMap[kFulfilled], result: promise };

  const [state, result] = getPromiseDetails(promise);

  if (state === kPending)
    return { state: StateMap[state] };

  return { state: StateMap[state], result };
}

module.exports = {
  getDetails,
  mount,
  resolve: promiseResolve,
  reject: promiseReject,
  create: createPromise,
};
