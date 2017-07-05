## promise_util

Static Methods:
- `create()` -> Promise
- `resolve(Promise, *)` -> Promise
- `reject(Promise, *)` -> Promise

Static `resolve`/`reject` behave normally if:
1. arguments.length is 1  
**OR**
2. arguments[0] is not instanceof Promise

Prototype Methods:
- `resolve(*)` -> Promise
- `reject(*)` -> Promise

Prototype Properties:
- `info` -> `{ status: String, value?: * }`
- `isResolved` -> Boolean
- `isRejected` -> Boolean
- `isPending` -> Boolean