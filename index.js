'use strict';

const { runInThisContext } = require('vm');
const { setFlagsFromString } = require('v8');

setFlagsFromString('--allow-natives-syntax');
const { resolve: originalResolve, reject: originalReject } = Promise;
const {
  createPromise, promiseResolve, promiseReject,
  getPromiseDetails, kPending, kFulfilled, kRejected,
} = runInThisContext(`({
  createPromise: () => new Promise(() => {}),
  promiseResolve: (p, v) => %ResolvePromise(p, v),
  promiseReject: (p, r) => %RejectPromise(p, r, false),
  getPromiseDetails: (p) => {
    if (!(p instanceof Promise)) {
      return [];
    }
    return [%PromiseStatus(p), %PromiseResult(p)];
  },
  kPending: 0,
  kFulfilled: 1,
  kRejected: 2,
})`);

const mounted = new WeakSet();

const StateMap = {
  [kPending]: 'pending',
  [kFulfilled]: 'fulfilled',
  [kRejected]: 'rejected',
};

function getDetails(promise) {
  if (!(promise instanceof Promise)) {
    return { state: StateMap[kFulfilled], result: promise };
  }

  const [state, result] = getPromiseDetails(promise);

  if (state === kPending) {
    return { state: StateMap[state] };
  }

  return { state: StateMap[state], result };
}

function mount(Promise = global.Promise) {
  if (mounted.has(Promise)) {
    return;
  }
  mounted.add(Promise);

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
    details: { get() {
      return getDetails(this);
    } },
    isResolved: { get() {
      return getPromiseDetails(this)[0] === kFulfilled;
    } },
    isRejected: { get() {
      return getPromiseDetails(this)[0] === kRejected;
    } },
    isPending: { get() {
      return getPromiseDetails(this)[0] === kPending;
    } },
    resolve: { value(x) {
      return promiseResolve(this, x);
    } },
    reject: { value(x) {
      return promiseReject(this, x);
    } },
  });

  Promise.delay = Promise.sleep = function sleep(time) {
    const p = Promise.create();
    setTimeout(p.resolve.bind(p), time);
    return p;
  };

  Promise.each = function each(input) {
    return new Promise(async (resolve, reject) => {
      const iterator = input[Symbol.iterator]();
      const resolved = [];
      for (const item of iterator) {
        try {
          resolved.push(await item); // eslint-disable-line no-await-in-loop
        } catch (e) {
          reject(e);
          break;
        }
      }
      resolve(resolved);
    });
  };
}

module.exports = {
  getDetails,
  mount,
  resolve: promiseResolve,
  reject: promiseReject,
  create: createPromise,
};
