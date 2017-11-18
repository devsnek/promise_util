## promise_util

Static Methods:
- `create()` -> Promise
- `resolve(Promise, *)` -> Promise
- `reject(Promise, *)` -> Promise
- `sleep(Number)`/`delay(Number)` -> Promise
- `each(Iterable)` -> Promise

Static `resolve`/`reject` behave normally if:
1. arguments.length is 1  
**OR**
2. arguments[0] is not instanceof Promise

Prototype Methods:
- `resolve(*)` -> Promise
- `reject(*)` -> Promise

Prototype Properties:
- `info` -> `{ state: String, result?: * }`
- `isResolved` -> Boolean
- `isRejected` -> Boolean
- `isPending` -> Boolean
