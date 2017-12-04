const PromiseUtil = require('.');
const tap = require('tap');

tap.plan(9);

// unmounted tests

{
  const p = PromiseUtil.create();
  tap.same(PromiseUtil.getDetails(p), { state: 'pending' }, 'unmounted details for pending');
}

{
  const p = Promise.resolve(5);
  tap.same(PromiseUtil.getDetails(p), { state: 'resolved', result: 5 }, 'unmounted details for resolved');
}

{
  const e = new Error('error');
  const p = Promise.reject(e);
  p.catch(() => {});
  tap.same(PromiseUtil.getDetails(p), { state: 'rejected', result: e }, 'unmounted details for rejected');
}

// mounted tests
PromiseUtil.mount();

{
  const p = Promise.create();
  tap.same(p.details, { state: 'pending' }, 'mounted details for pending');
  tap.ok(p.isPending, 'mounted isPending');
}

{
  const p = Promise.resolve(5);
  tap.same(p.details, { state: 'resolved', result: 5 }, 'mounted details for resolved');
  tap.ok(p.isResolved, 'mounted isResolved');
}

{
  const e = new Error('error');
  const p = Promise.reject(e);
  p.catch(() => {});
  tap.same(p.details, { state: 'rejected', result: e }, 'mounted details for rejected');
  tap.ok(p.isRejected, 'mounted isRejected');
}

tap.end();
