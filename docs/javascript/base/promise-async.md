# 期约与异步函数
内容
- 异步编程
- 期约
- 异步函数

ECMAScript6 及以后的几个版本逐步加大了对异步编程机制的支持。ECMAScript 6 新增了正式的 Promise（期约）引用类型，支持优雅地定义和组织异步逻辑。

## 异步编程
同步行为和异步行为的对立统一是计算机科学的一个基本概念。特别是在 JavaScript 这种单线程事件循环模型中，同步操作与异步操作更是代码所要依赖的核心机制。异步行为是为了优化因计算量大而时间长的操作。如果在等待其他操作完成的同时，即使运行其他指令，系统也能保持稳定，那么这样做就是务实的

### 同步与异步
同步行为对应内存中顺序执行的处理器指令。每条指令都会严格按照他们出现的顺序来执行，而每条指令执行后也能立即获得存储在系统本地（如寄存器或系统内存）的信息。这样的执行流程容易分析程序在执行到代码人意位置时的状态（比如变量的值）

同步操作的例子可以是执行一次简单的数学计算

```js
let x = 3
x = x + 4
```

在程序执行的每一步，都可以推断出程序的状态。这是因为后面的指令总是在前面的指令完成后才会执行。等到最后一条指令执行完毕，存储在 x 的值就立即可以使用

这两行 JavaScript 代码对应的低级指令（从 JavaScript 到 x86）并不难想象。首先，操作系统会在栈内存上分配一个存储浮点数值的空间，然后针对这个值做一次数学计算，再把计算结果写回之前分配的内存中。所有这些指令都是单个线程中按顺序执行的。在低级指令的层面，有充足的工具可以确定系统状态

相对地，异步行为类似于系统中断，即当前进程外部的实体可以触发代码执行。异步操作经常是必要的，因为强制进程等待一个长时间的操作通常是不可行的（同步操作则必须等待）。如果代码要访问一些高延迟的资源，比如向远程服务器发送请求并等待响应，那么就会出现长时间的等待

异步操作的例子看也是在定时回调中执行一次简单的数学计算

```js
let x = 3
setTimeout(() => x = x + 4, 1000)
```

这段程序最终与同步代码执行的任务一样，都是把两个数加在一起，但这一次执行线程不知道 x 值何时会改变，因为这取决于回调何时从消息队列出列并执行

异步代码不容易推断。虽然这个例子对于的低级代码最终跟前面的例子没什么区别，但第二个指令块（加操作及赋值操作）是由系统计时器触发的，这会生成一个入队执行的中断。到底什么时候会触发这个中断，这对 JavaScript 运行时来说是一个黑盒，因此实际上无法预知（尽管可以保证这发生在当前线程的同步代码执行之后，否则回调都没有机会出列被执行）。无论如何，在排定回调以后基本没办法知道系统状态何时改变

为了让后续代码能够使用 x，异步执行的函数需要在更新 x 的值以后通知其他代码。如果程序不需要这个值，那么就只管继续执行，不必等待这个结果了

设计一个能够知道 x 什么时候可以读取的系统非常难。JavaScript 在实现这样一个系统的过程经历了几次迭代

### 以往的异步编程模式
异步行为是 JavaScript 的基础，但以前的实现不理想。在早期的 JavaScript 中，只支持回调函数来表明异步操作完成。串联多个异步操作是个常见的问题，通常需要深度嵌套的回调函数（俗称“回调地狱”）来解决

假设有以下异步函数，使用了 setTimeout 在一秒钟之后执行某些操作

```js
function double(value) {
  setTimeout(() => setTimeout(console.log, 0, value * 2), 1000)
}

double(3)
// 6 （大约 1000毫秒之后）
```

这里的代码没什么神秘的，但关键是理解为什么说他是一个异步函数。setTimeout 可以定义一个在指定时间之后会被调度执行的回调函数。对这个例子而言，1000毫秒之后，JavaScript 运行时会把回调函数推到自己的消息队列上去等待执行。推到队列之后，回调什么时候被执行对 JavaScript 代码就完全不可见了。还有一点，double() 函数在 setTimeout 成功调度异步操作之后会立即退出。

#### 异步返回值
假设 setTimeout 操作会返回一个有用的值。有什么好办法把这个值传给需要他的地方？广泛接受的一个策略是给异步操作提供一个回调，这个回调中包含要使用异步返回值的代码（作为回调的参数）

```js
function double(value, callback) {
  setTimeout(() => callback(value * 2), 1000)
}

double(3, (x) => console.log(`given ${x}`))
```

这里的 setTimeout 调用告诉 JavaScript 运行时在 1000 毫秒之后把一个函数推到消息队列上。这个函数会由运行时负责异步调度执行。而位于函数闭包中的回调及其参数在异步执行时仍然是可用的

### 失败处理
异步操作的失败处理在回调模型中也要考虑，因此自然就出现了成功回调和失败回调

```js
function double(value, success, failure) {
  setTimeout(() => {
    try {
      if (typeof value !== 'number') {
        throw 'must provide number as first argument'
      }
      success(value * 2)
    } catch (e) {
      failure(e)
    }
  }, 1000)
}

const successCallback = (x) => console.log(x)
const failureCallback = (e) => console.log(e)

double(3, successCallback, failureCallback)
double('a', successCallback, failureCallback)
```

这种模式已经不可取了，因为必须在初始化异步操作时定义回调。异步函数的返回值只在短时间内存在，只有预备好将这个短时间内存在的值作为参数的回调才能接收到他

#### 嵌套异步回调
如果异步返回值又依赖另一个异步返回值，那么回调的情况还会进一步变复杂。在实际代码中，这就要求嵌套回调

```js
function double(value, success, failure) {
  setTimeout(() => {
    try {
      if (typeof value !== 'number') {
        throw 'must provide number as first argument'
      }
      success(value * 2)
    } catch (e) {
      failure(e)
    }
  }, 1000)
}

// 嵌套回调
const successCallback = (x) => {
  double(x, (y) => console.log(y))
}
const failureCallback = (e) => console.log(e)

double(3, successCallback, failureCallback)
```

显然，随着代码越来越复杂，回调策略是不具有扩展性的。“回调地狱” 这个称呼可谓实至名归。嵌套回调的代码维护起来就是噩梦

## 期约
期约是对尚不存在结果的一个替身。

### Promises/A+ 规范
早期的期约机制在 JQuery 和 Dojo 中是以 Deferred API 的形式出现的。到了 2010 年，CommonJS 项目实现的 Promises/A 规范日益流行起来。Q 和 Bluebird 等第三方 JavaScript 期约库也越来越得到社区认可，虽然这些库的实现多少都有些不同。为弥合现有实现之间的差异，2012 年 Promises/A+ 组织分叉（fork）了 CommonJS 的 Promises/A 建议，并以相同的名字制定了 Promises/A+ 规范。这个规范最终成为了 ECMAScript 6 规范实现的范本

ECMAScript6 增加了对 Promises/A+ 规范的完善支持，即 Promise 类型。一经推出，Promise 就大受欢迎，成为了主导性道德异步编程机制。所有现代浏览器都支持 ES6 期约，很多浏览器 API（如 fetch() 等）也以期约为基础

### 期约基础
ES6 新增的引用类型 Promise，可以通过 new 操作符来实例化。创建新期约时需要传入执行器 executor 函数作为参数。下面例子使用了一个空函数对象来应付一下解释器

```js
let p = new Promise(() => {})
setTimeout(console.log, 0, p) // Promise<pending>
```

之所以说是应付解释器，是因为如果不提供执行器函数，就会抛出 SyntaxError

#### 期约状态机
在把一个期约实例传给 console.log 时，控制台输出表明该实例处于`待定（pending）状态`。如前所述，期约是一个有状态的对象，可能处于如下3种状态之一

- 待定 pending
- 兑现 fulfilled，有时候也称为 “解决”，resolved
- 拒绝 rejected

待定（pending）是期约的最初始状态。在待定状态下，期约可以落定（settled）为代表成功的兑现（fulfilled）状态，或者代表失败的拒绝（rejected）状态。无论落定为哪种状态都是不可逆的。只要从待定转换为兑现或拒绝，期约的状态就不再改变。而且，也不能保证期约必然会脱离待定状态。因此，组织合理的代码无论期约解决（resolve）还是拒绝（reject），甚至永远处于待定（pending）状态，都应该都恰当的行为

重要的是，期约的状态是私有的，不能直接通过 JavaScript 检测到。这主要是为了避免根据读取到的期约状态，以同步方式处理期约对象。另外，期约的状态也不能被外部 JavaScript 代码修改。这与不能读取该状态的原因是一样的。期约故意将异步行为封装起来，从而隔离外部的同步代码

#### 解决值、拒绝理由及期约用例
期约主要有两大用途。首先是抽象地表示一个异步操作。期约的状态代表期约是否完成。待定表示尚未开始或者正在执行中。兑现表示已经成功完成，而拒绝表示没有成功完成

某些情况下，这个状态机就是期约可以提供的最有用的信息。知道一段异步代码已经完成，对于其他代码而言已经足够了。比如：假设期约要向服务器发送一个 HTTP 请求。请求返回 200 ～ 299 范围内的状态码就足以让期约的状态变为 兑现。如果请求返回的状态码不再 200 ～ 299 这个范围内，就把期约状态变为 拒绝

在另外一些情况下，期约封装的异步操作会实际生成某个值，而程序期待期约状态改变时可以访问这个值。相应地，如果期约被拒绝，程序就会期待期约状态改变时可以拿到拒绝的理由。比如，假设期约向服务器发送一个 HTTP 请求并预定会返回一个 JSON。如果请求返回范围在 200 ～ 299 的状态码，则期约状态变为兑现。此时期约内部可以接收到一个 JSON 字符串。类似，如果请求返回的状态码不在 200 ～ 299 范围内，那么期约状态变为拒绝。此时拒绝的理由可能是一个 Error 对象，包含着 HTTP 状态码及相关错误信息

为了支持这两种用例。每个期约只要状态切换为兑现，就会有一个私有的内部值 value。类似地，每个期约状态为拒绝，就会有一个私有的内部理由 （reason）。无论值还是理由，都是包含原始值或对象的不可修改的引用。二者都是可选的，而且默认值为 undefined。在期约到底某个落地状态时执行的异步代码始终会接收到这个值或理由

#### 通过执行函数控制期约状态
由于期约的状态是私有的，所以只能在内部进行操作。内部操作在期约的执行器函数中完成。执行器函数主要有两项职责：初始化期约的异步行为和控制状态的最终转换。其中，控制期约状态的转换是通过调用他的两个函数参数实现的。这个两个函数参数通常都命名为 resolve() 和 reject() 。调用 resolve() 会把状态切换为兑现，调用 reject() 会把状态切换为拒绝。另外，调用 reject() 也会抛出错误

```js
let p1 = new Promise((resolve, reject) => resolve())
setTimeout(console.log, 0, p1) // Promise<resolved>

let p2 = new Promise((resolve, reject) => reject())
setTimeout(console.log, 0, p2) // Promise<rejected>
// Uncaught error (in promise)
```

在前面的例子中，并没有什么异步操作，因为在初始化期约时，执行器函数已经改变了每个期约的状态。这里的关键在于，执行器函数是同步执行的。这是因为执行器函数是期约的初始化程序。通过下面例子可以看出上面代码的执行顺序

```js
new Promise(() => setTimeout(console.log, 0, 'executor'))
setTimeout(console.log, 0, 'promise initialized')

// executor
// promise initialized
```

添加 setTimeout 可以推迟切换状态

```js
let p = new Promise((resolve, reject) => setTimeout(resolve, 1000))

// 在 console.log 打印期约实例的时候，还不会执行超时回调（即 resolve())
setTimeout(console.log, 0, p) // Promise<pending>
```

无论 resolve() 或 reject() 中的哪个被调用，状态切换都不可撤销了。于是继续修改状态会静默失败

```js
let p = new Promise((resolve, reject) => {
  resolve()
  reject() // 没有效果
})

setTimeout(console.log, 0, p) // Promise<resolved>

```

为避免期约卡在待定状态，可以添加一个定时退出的功能。比如，可以通过 setTimeout 设置一个 10秒钟后无论如何都会执行拒绝期约的回调

```js
let p = new Promise((resolve, reject) => {
  setTimeout(reject, 10000) // 10秒后调用 reject
  // 执行函数的逻辑
})

setTimeout(console.log, 0, p) // Promise<pending>
setTimeout(console.log, 11000, p) // Promise<rejected>
```

因为期约的状态只能改变一次，所以这里的超时拒绝逻辑中可以放心地设置让期约处于待定状态的最长时间。如果执行器中的代码在超时之前已经解决或拒绝，那么超时回调再尝试决绝也会静默失败

#### Promise.resolve()
期约并非一开始就必须处于待定状态，然后通过执行器函数才能转换为落定状态。通过调用 Promise.resolve() 静态方法，可以实例化一个解决的期约。

```js
let p1 = new Promise((resolve, reject) => resolve())
let p2 = Promise.resolve()
```

这个解决的期约的值对应传给 Promise.resolve() 的第一个参数。使用这个静态方法，实际上可以把任何值都转换为一个期约

```js
setTimeout(console.log, 0, Promise.resolve())
// Promise<resolved>: undefined

setTimeout(console.log, 0, Promise.resolve(3))
// Promise<resolved>: 3

// 多余的参数会忽略
setTimeout(console.log, 0, Promise.resolve(4, 5, 6))
// Promise<resolved>: 4
```

对这个静态方法而言，如果传入的参数本身是一个期约，那他的行为类似于一个空包装，因此 Promise.resolve() 可以说是一个幂等方法

```js
let p = Promise.resolve(7)

setTimeout(console.log, 0, p === Promise.resolve(p))
// true

setTimeout(console.log, 0, p === Promise.resolve(Promise.resolve(p)))
// true
```

这个幂等性会保留传入期约的状态

```js
let p = new Promise(() => {})

setTimeout(console.log, 0, p) // Promise<pending>
setTimeout(console.log, 0, Promise.resolve(p)) // Promise<pending>

setTimeout(console.log, 0, p === Promise.resolve(p)) // true
```

注意，这个静态方法能够包装任何非期约值，包括错误对象，将其转换为解决的期约。因此，也可能导致不符合预期的行为

```js
let p = Promise.resolve(new Error('error'))

setTimeout(console.log, 0, p)
// Promise<resolved>: Error: foo
```

#### Promise.reject()
与 Promise.resolve() 类似，Promise.reject() 会实例化一个拒绝的期约并抛出一个异步错误（这个错误不能通过 try/catch 捕获，而只能通过拒绝处理程序捕获）

```js
let p1 = new Promise((resolve, reject) => reject())
let p2 = Promise.reject()
```

这个拒绝的期约的理由就是传给 Promise.reject() 的第一个参数。这个参数也会传给后续的拒绝处理程序

```js
let p = Promise.reject(3)
setTimeout(console.log, 0, p) // Promise <rejected>: 3

p.then(null, (e) => setTimeout(console.log, 0, e)) // 3
```

关键在于，Promise.reject() 并没有照搬 Promise.resolve() 的幂等逻辑。如果给他传一个期约对象，则这个期约会成为他返回的拒绝期约的理由

```js
setTimeout(console.log, 0, Promise.reject(Promise.resolve()))
// Promise <rejected>: Promise <resolved>
```

#### 同步/异步执行二元性
Promise 的设计很大程度上会导致一种完全不同于 JavaScript 的计算模式。

```js
try {
  throw new Error('error1')
} catch (e) {
  console.log(e) // Error: error1
}

try {
  Promise.reject(new Error('error2'))
} catch (e) {
  console.log(e)
}
// Uncaught (in promise) Error: bar
```

第一个 try/catch 抛出并捕获了错误，第二个 try/catch 抛出错误却没有捕获到。这可能有点违反直觉，因为代码中确实是同步创建了一个拒绝的期约实例，而这个实例也抛出了包含拒绝理由的错误。这里的同步代码之所以没有捕获期约抛出的错误，是因为他没有通过异步模式捕获错误。从这里就可以看出期约真正的异步特性：他们是同步对象（在同步执行模式中使用），但也是异步执行模式的媒介

在前面的例子中，拒绝期约的错误并没有抛到执行同步代码的线程里，而是通过浏览器异步消息队列来处理。因此，try/catch 块并不能捕获该错误。代码一旦开始以异步模式执行，则唯一与之交互的方式就是使用异步结构 -- 更具体地说，就是期约的方法

### 期约的实例方法
期约实例的方法是连接外部同步代码与内部异步代码之间的桥梁。这些方法可以访问异步操作返回的数据、处理期约成功和失败的结果，连续对期约求值，或者添加只有期约进入终止状态时才会执行的代码

#### 实现 Thenable 接口 （可连续的）
在 ECMAScript 暴露的异步结构中，任何对象都有一个 then() 方法。这个方法被认为实现了 Thenable 接口

```js
class MyThenable {
  then() {}
}
```

ECMAScript 的 Promise 类型实现了 Thenable 接口。这个简化的接口跟 TypeScript 或其他包中的接口或类型定义不同，他们都设定了 Thenable 接口更具体的形式

#### Promise.prototype.then()
Promise.prototype.then() 是为期约实例添加处理程序的主要方法。这个 then() 方法接收最多两个参数：onResolved 处理程序和 onRejected 处理程序。这两个参数都是可选的，如果提供的话，则会在期约分别进入 “兑现” 和 “拒绝” 状态时执行

```js
function onResolved(id) {
  console.log(id, 'onResolved')
}

function onRejected(id) {
  console.log(id, 'rejected')
}

let p1 = new Promise((resolve, reject) => setTimeout(resolve, 3000))
let p2 = new Promise((resolve, reject) => setTimeout(reject, 3000))

p1.then(() => onResolved('p1'), () => onRejected('p1'))
p2.then(() => onResolved('p2'), () => onRejected('p2'))

// p1 onResolved
// p2 onRejected
```

因为期约只能转换为最终状态一次。所以这两个操作一定是互斥的

两个处理程序参数都是可选的。而且，传给 then() 的任何非函数类型的参数都会被静默忽略。如果想只提供 onRejected 参数，那就要在 onResolved 参数的位置上传入 undefined。有助于避免在内存中创建多余的对象

```js
function onResolved(id) {
  console.log(id, 'onResolved')
}

function onRejected(id) {
  console.log(id, 'rejected')
}

let p1 = new Promise((resolve, reject) => setTimeout(resolve, 3000))
let p2 = new Promise((resolve, reject) => setTimeout(reject, 3000))

// 非函数处理程序会被静默忽略
p1.then('something')

// 不传 onResolved 处理程序的规范写法
p2.then(null, () => onRejected('p2'))
```

Promise.prototype.then() 方法返回一个新的期约实例

```js
let p1 = new Promise(() => {})
let p2 = p1.then()

setTimeout(console.log, 0, p1) // Promise <pending>
setTimeout(console.log, 0, p2) // Promise <pending>
setTimeout(console.log, 0, p1 === p2) // false
```

这个新期约实例基于 onResolved 处理程序的返回值构建。换句话说，该处理程序的返回值会通过 Promise.resolve() 包装来生成新期约。如果没有提供这个处理程序，则 Promise.resolve() 就会包装上一个期约解决之后的值。如果没有显式的返回语句，则 Promise.resolve() 会包装默认的返回值 undefined

```js
let p1 = Promise.resolve('foo')

// 若调用 then() 时不传入处理程序，则原样向后传
let p2 = p1.then()

setTimeout(console.log, 0, p2) // Promise <resolved>: foo

// 这些一样
let p3 = p1.then(() => undefined)
let p4 = p1.then(() => {})
let p5 = p1.then(() => Promise.resolve())

setTimeout(console.log, 0, p3) // Promise <resolved>: undefined
setTimeout(console.log, 0, p4) // Promise <resolved>: undefined
setTimeout(console.log, 0, p5) // Promise <resolved>: undefined
```

如果有显式的返回值，则 Promise.resolve() 会包装这个值

```js
let p6 = p1.then(() => 'bar')
let p7 = p1.then(() => Promise.resolve('bar'))

setTimeout(console.log, 0, p6) // Promise <resolved>: bar
setTimeout(console.log, 0, p7) // Promise <resolved>: bar

// Promise.resolve() 保留返回的期约
let p8 = p1.then(() => new Promise(() => {}))
let p9 = p1.then(() => Promise.reject())
// Uncaught (in promise): undefined

setTimeout(console.log, 0, p8) // Promise <pending>
setTimeout(console.log, 0, p9) // Promise <rejected>: undefined
```

抛出异常会返回拒绝的期约

```js
let p10 = p1.then(() => { throw 'baz' })
// Uncaught (in promise) baz

setTimeout(console.log, 0, p10) // Promise <rejected> baz
```

注意，返回错误值不会触发上面的拒绝行为，而会把错误对象包装在一个解决的期约中

```js
let p11 = p1.then(() => Error('xxx'))

setTimeout(console.log, 0, p11) // Promise <resolved>: Error: xxx
```

onRejected 处理程序也与之类似：onRejected 处理程序返回的值也会被 Promise.resolve() 包装。这可能有点违反直觉，但是想想，onRejected 处理程序的任务不就是捕获异步错误吗？因此，拒绝处理程序在捕获错误后不抛出异常是符合期约的行为，应该返回一个解决期约

```js
let p1 = Promise.reject('foo')

// 调用 then() 时不传处理程序则原样向后传
let p2 = p1.then()
// Uncaught (in promise) foo
setTimeout(console.log, 0, p2) // Promise <rejected>: foo

// 这些一样
let p3 = p1.then(null, () => undefined)
let p4 = p1.then(null, () => {})
let p5 = p1.then(null, () => Promise.resolve())

setTimeout(console.log, 0, p3) // Promise <resolved>: undefined
setTimeout(console.log, 0, p4) // Promise <resolved>: undefined
setTimeout(console.log, 0, p5) // Promise <resolved>: undefined

// 这些一样
let p6 = p1.then(null, () => 'bar')
let p7 = p1.then(null, () => Promise.resolve('bar'))

setTimeout(console.log, 0, p6) // Promise <resolved>: bar
setTimeout(console.log, 0, p7) // Promise <resolved>: bar

// Promise.resolve() 保留返回的期约
let p8 = p1.then(null, () => new Promise(() => {}))
let p9 = p1.then(null, () => Promise.reject())
// Uncaught (in promise) undefined

setTimeout(console.log, 0, p8) // Promise <pending>
setTimeout(console.log, 0, p9) // Promise <rejected>: undefined

let p10 = p1.then(null, () => { throw 'baz' })
// 

setTimeout(console.log, 0, p10) // Promise <rejected>: baz

let p11 = p1.then(null, () => Error('xxx'))

setTimeout(console.log, 0, p11) // Promise <resolved>: Error: xxx
```

#### Promise.prototype.catch()
Promise.prototype.catch() 方法用于给期约添加处理程序。这个方法只接收一个参数，onRejected 处理程序。事实上，这个方法是一个语法糖，调用他就相当于调用 Promise.prototype.then(null, onRejected)

```js
let p = Promise.reject()
let onRejected = function(e) {
  setTimeout(console.log, 0, 'rejected')
}

// 这两种添加拒绝处理的方式是一样的
p.then(null, onRejected)
p.catch(onRejected)
```

Promise.prototype.catch() 返回一个新的期约实例

```js
let p1 = new Promise(() => {})
let p2 = p1.catch()
setTimeout(console.log, 0, p1) // Promise <pending>
setTimeout(console.log, 0, p2) // Promise <pending>
setTimeout(console.log, 0, p1 === p2) // false
```

在返回新期约实例方面，Promise.prototype.catch() 的行为与 Promise.prototype.then() 的 onRejected 处理程序是一样的

#### Promise.prototype.finally()
Promise.prototype.finally() 方法用于给期约添加 onFinally 处理程序，这个处理程序在期约转换为解决或拒绝状态时都会执行。这个方法可以避免 onResolved 和 onRejected 处理程序中出现冗余代码。但 onFinally 处理程序没有办法知道期约的状态是解决还是拒绝，所以这个方法主要用于清理代码，（清空代码的状态）

```js
let p1 = Promise.resolve()
let p2 = Promise.reject()
let onFinally = function() {
  console.log('finally')
}

p1.finally(onFinally) // Finally
p2.finally(onFinally) // Finally
```

Promise.prototype.finally() 方法返回一个新的期约实例

```js
let p1 = new Promise(() => {})
let p2 = p1.finally()

setTimeout(console.log, 0, p1) // Promise <pending>
setTimeout(console.log, 0, p2) // Promise <pending>
setTimeout(console.log, 0, p1 === p2) // false
```

这个新期约实例不同于 then() 或 catch() 方法返回的实例。因为 onFinally 被设计为一个状态无关的方法，所以在大多数情况下他将表现为父期约的传递。对于已解决和被拒绝状态都是如此

```js
let p1 = Promise.resolve('foo')

// 这里都会原样后传
let p2 = p1.finally()
let p3 = p1.finally(() => undefined)
let p4 = p1.finally(() => {})
let p5 = p1.finally(() => Promise.resolve())
let p6 = p1.finally(() => 'bar')
let p7 = p1.finally(() => Promise.resolve('bar'))
let p8 = p1.finally(() => Error('xxx'))

setTimeout(console.log, 0, p2) // Promise <resolved>: foo
setTimeout(console.log, 0, p3) // Promise <resolved>: foo
setTimeout(console.log, 0, p4) // Promise <resolved>: foo
setTimeout(console.log, 0, p5) // Promise <resolved>: foo
setTimeout(console.log, 0, p6) // Promise <resolved>: foo
setTimeout(console.log, 0, p7) // Promise <resolved>: foo
setTimeout(console.log, 0, p8) // Promise <resolved>: foo
```

如果返回的是一个待定的期约，或者 onFinally 处理程序抛出了错误（显式抛出或返回了一个拒绝期约），则会返回响应的期约（待定或拒绝）

```js
// Promise.resolve() 保留返回的期约
let p9 = p1.finally(() => new Promise(() => {}))
let p10 = p1.finally(() => Promise.reject())

setTimeout(console.log, 0, p9) // Promise <pending>
setTimeout(console.log, 0, p10) // Promise <rejected>: undefined

let p11 = p1.finally(() => { throw 'baz' })

setTimeout(console.log, 0, p11) // Promise <rejected>: baz
```

返回待定期约的情形并不常见，这是因为只要期约已解决，新期约仍然会原样后传初始的期约

```js
let p1 = Promise.resolve('foo')

// 忽略解决的值
let p2 = p1.finally(() => new Promise((resolve, reject) => setTimeout(() => resolve('bar'), 100)))

setTimeout(console.log, 0, p2) // Promise <pending>
setTimeout(() => setTimeout(console.log, 0, p2), 200)
```

#### 非重入期约方法
当期约进入落定状态时，与该状态相关的处理程序仅仅会被排期，而非立即执行。跟在添加这个处理程序的代码之后的同步代码一定会在处理程序之前先执行。即使期约一开始就是与附加处理程序关联的状态，执行顺序也是这样的。这个特性由 JavaScript 运行时保证，被称为 “非重入”（non-reentrancy）特性

```js
// 创建解决的期约
let p = Promise.resolve()

// 添加解决处理程序
// 直觉上，这个处理程序会等期约一解决就执行
p.then(() => console.log('onResolved handler'))

// 同步输出，证明 then() 已经返回
console.log('then() returns')

// 实际输出
// then() returns
// onResolved handler
```

在这个例子中，在一个解决期约上调用 then() 会把 onResolved 处理程序推进消息队列。但这个处理程序在当前线程上的同步代码执行完成前不会执行。因此，跟在 then() 后面的同步代码一定先于处理程序执行

先添加处理程序后解决期约也是一样的。如果添加处理程序后，同步代码才改变期约状态，那么处理程序仍然会基于该状态变化表现出非重入特性。下面的例子展示了即使先添加了 onResolved 处理程序，再同步调用 resolve()，处理程序也不会进入同步线程执行

```js
let synchronousResolve

// 创建一个契约并将解决函数保存在一个局部变量中
let p = new Promise((resolve) => {
  synchronousResolve = function() {
    console.log(1)
    resolve()
    console.log(2)
  }
})

p.then(() => console.log(4))

synchronousResolve()
console.log(3)

// 实际输出
// 1
// 2
// 3
// 4
```

在这个例子中，即使期约状态变化发生在添加处理程序之后，处理程序也会等到运行的消息队列让他出列时才执行

非重入适用于 onResolved/onRejected 处理程序、catch() 处理程序和 finally() 处理程序。下面的例子演示了这些处理程序都只能异步执行

```js
let p1 = Promise.resolve()
p1.then(() => console.log('p1 then() onResolved'))
console.log('p1')

let p2 = Promise.reject()
p2.then(null, () => console.log('p2 reject'))
console.log('p2')

let p3 = Promise.reject()
p3.catch(() => console.log('p3 catch'))
console.log('p3')

let p4 = Promise.resolve()
p4.finally(() => console.log('p4 finally'))
console.log('p4')

// p1
// p2
// p3
// p4
// p1 then
// p2 reject
// p3 catch
// p4 onFinally
```

#### 邻近处理程序的执行顺序
如果给期约添加多个处理程序，当期约状态变化时，相关处理程序会按照添加他们的顺序执行。无论 then()、catch() 还是 finally() 添加的处理程序都是如此

```js
let p1 = Promise.resolve()

p1.then(() => console.log(1))
p1.then(() => console.log(2))

// 1
// 2
```

#### 传递解决值和拒绝理由
到了落定状态后，期约会提供其解决值（如果兑现）或拒绝理由（如果拒绝）给相关状态的处理程序。拿到返回值后，就可以进一步对这个值进行操作。比如，第一次网络请求返回的 JSON 是发送第二次请求必须的数据，那么第一次请求返回的值就应该传给 onResolved 处理程序继续处理。当然，失败的网络请求也应该把 HTTP 状态码传给 onRejected 处理程序

在执行函数中，解决的值和拒绝的理由是分别作为 resolve() 和 reject() 的第一个参数后传的。然后，这些值又会传给他们各自的处理程序，作为 onResolved 或 onRejected 处理程序的唯一参数

```js
let p1 = new Promise((resolve) => resolve('foo'))
p1.then(value => console.log(value)) // foo

let p2 = new Promise((resolve, reject) => reject('bar'))
p2.catch(reason => console.log(reason))
```

Promise.resolve() 和 Promise.reject() 在被调用时就会接收解决值和拒绝理由。同样地，他们返回的期约也会像执行器一样把这些值传给 onResolved 和 onRejected 处理程序

```js
let p1 = Promise.resolve('foo')
p1.then(value => console.log(value)) // foo
```

#### 拒绝期约与拒绝错误处理
拒绝期约类似于 throw() 表达式，因为他们都代表一种处理程序，即需要中断或特殊处理。在期约的执行函数或处理程序中抛出错误会导致拒绝，对应的错误对象会成为拒绝的理由。因此以下这些期约会以一个错误对象为由被拒绝

```js
let p1 = new Promise((resolve, reject) => reject(Error('error')))
let p2 = new Promise((resolve, reject) => { throw Error('error') })
let p3 = Promise.resolve().then(() => { throw Error('error') })
let p4 = Promise.reject(Error('error'))

// 会抛出 4个 未捕获错误
```

期约可以让任何理由拒绝，包括 undefined，但最好统一使用错误对象。这样做主要是因为创建错误对象可以让浏览器捕获错误对象中的栈追踪信息。而这些信息对调试非常关键的

所有错误都是异步抛出且未处理的，通过错误对象捕获的栈追踪信息展示了从错误发生的路径。注意错误的顺序 Promise.resolve().then() 的错误最后才出现。这是因为他需要在运行时消息队列中添加处理程序，也就是说，在最终抛出未捕获错误之前他还会创建另一个期约

这个例子同样揭示了异步错误有意思的副作用。正常情况下，通过 throw() 关键字抛出错误时，JavaScript 运行时的错误处理机制会停止执行抛出错误之后的任何指令

```js
throw Error('')
console.log(1) // 这一行不会执行
```

但是，在期约中抛出错误时，因为错误实际上是从消息队列中异步抛出的，所以并不会阻止运行时继续执行同步指令

```js
Promise.reject(Error(''))
console.log(1)
// 1
```

异步错误只能通过异步的 onRejected 处理程序捕获

```js
// true
Promise.reject(Error('')).catch(e => {})

// false
try {
  Promise.reject(Error(''))
} catch (e) {}
```

这不包含捕获执行函数中的错误，在解决或拒绝期约之前，仍然可以使用 try/catch 在执行函数中捕获错误

```js
let p = new Promise((resolve, reject) => {
  try {
    throw Error('')
  } catch (e) {}

  resolve(1)
})

setTimeout(console.log, 0, p) // Promise <resolved>: 1
```

then() 和 catch() 的 onRejected 处理程序在语义上相当于 try/catch。出发点都是捕获错误之后将其隔离，同时不影响正常逻辑执行。为此，onRejected 处理程序的任务应该是在捕获异常错误之后返回一个解决的期约。下面的例子中对比了同步错误处理与异步错误处理

```js
// console.log(1)
try {
  throw Error('e')
} catch (e) {
  console.log(e)
}

console.log(2)

// 1
// Error: e
// 1


new Promise((resolve, reject) => {
  console.log(1)
  reject('e')
}).catch(e => {
  console.log(e)
}).then(() => {
  console.log(2)
})

// 1
// Error: e
// 2
```

### 期约连锁与期约合成
多个期约子和在一起可以构成强大的代码逻辑。这种组合可以通过两种方式实现：期约连锁与期约合成。前者就是一个期约接一个期约地拼接，后者则是多个期约组合成为一个期约

#### 期约连锁
把期约逐个地串联起来是一种非常有用的编程模式。之所以可以这样做，是因为每个期约实例的方法都会返回一个新的期约对象，而这个新期约又有自己的实例方法。这样连缀方法调用就可以构成所谓的“期约连锁”

```js
let p = new Promise((resolve, reject) => {
  console.log(1)
  resolve()
})

p.then(() => console.log(2))
  .then(() => console.log(3))
  .then(() => console.log(4))
```

这个实现最终执行了一连串同步任务。正因为如此，这种方式执行的任务没有那么有用，毕竟分别使用 4个同步函数也可以做到

要真正执行异步任务，可以改写前面的例子，让每个执行器都返回一个期约实例。这样就可以让每个后续期约等待之前的期约，也就是串行化异步任务。

```js
let p1 = new Promise((resolve, reject) => {
  console.log(1)
  setTimeout(resolve, 1000)
})

p1.then(() => new Promise((resolve, reject) => {
  console.log(2)
  setTimeout(resolve, 1000)
}))
  .then(() => new Promise((resolve, reject) => {
    console.log(3)
    setTimeout(resolve, 1000)
  }))
  .then(() => new Promise((resolve, reject) => {
    console.log(4)
    setTimeout(resolve, 1000)
  }))
```

每个后续的处理程序都会等待前一个期约解决，然后实例化一个新期约并返回他。这种结构可以简洁地将异步任务串行化，解决之前依赖回调的问题。

期约可以解决回调地狱的问题

因为 then() catch() 和 finally() 都返回期约，所以串联这些方法很直观

```js
let p = new Promise((resolve, reject) => {
  console.log(1)
  reject()
})

p.catch(() => console.log(2))
  .then(() => console.log(3))
  .finally(() => console.log(4))
```

#### Promise.all() 和 Promise.race()
Promise 类提供两个将多个契约实例组合成一个期约的静态方法：Promise.all() 和 Promise.race()。

##### Promise.all()
Promise.all() 静态方法创建的契约会在一组期约全部解决之后再解决。这个静态方法接收一个可迭代对象，返回一个新期约

```js
let p1 = Promise.all([
  Promise.resolve(),
  Promise.resolve()
])

// 可迭代对象中的元素会通过 Promise.resolve() 转换为期约
let p2 = Promise.all([3, 4])

// 空的可迭代对象等价于 Promise.resolve()
let p3 = Promise.all([])

// 无效的语法
let p4 = Promise.all()
```

合成的期约只会在每个包含的期约都解决之后才解决

如果至少有一个包含的期约待定，则合成的期约也会待定。如果有一个包含的期约拒绝，则合成的期约也会拒绝

如果所有期约都成功解决，则合成期约的解决值就是所有包含期约解决值的数组，按照迭代顺序

```js
let p = Promise.all([
  Promise.resolve(3)
  Promise.resolve()
  Promise.resolve(4)
])

p.then(values => console.log(values)) // [3, undefined, 4]
```

如果有期约拒绝，则第一个拒绝的期约会将自己的理由作为合成期约的拒绝理由。之后再拒绝的期约也不会影响最终期约的拒绝理由。不过，这并不影响所有包含期约正常的拒绝操作。合成的期约会静默处理所有包含期约的拒绝操作

```js
// 虽然只有第一个期约的拒绝理由会进入
// 拒绝处理程序，第二个契约的拒绝也会被静默处理，不会有错误跑掉

let p = Promise.all([
  Promise.reject(3),
  new Promise((resolve, reject) => setTimeout(reject), 1000)
])

p.catch(reason => console.log(reason)) // 3
```

##### Promise.race()
Promise.race() 静态方法返回一个包装期约，是一组集合中最先解决或拒绝的期约的镜像。这个方法接收一个可迭代对象，返回一个新期约

Promise.race() 不会对解决或拒绝的期约区别对待。无论是解决还是拒绝，只要是第一个落定的期约，Promise.race() 就会包装其解决值或拒绝理由并返回新契约 （谁先改变状态就返回谁的结果）

如果有一个契约拒绝，只要它是第一个落定的，就会成为拒绝合成期约的理由。之后再拒绝的期约不会影响最终期约的拒绝理由。不过，这并不影响所有包含期约正常的拒绝操作。与 Promise.all() 类似，合成期约会静默处理所有包含期约的拒绝操作

#### 串行期约合成
期约的另一个主要特性：异步产生值并将其传给处理程序。基于后续期约使用之前期约的返回值来串联期约是期约的基本功能。这很像函数合成，即将多个函数合成为一个函数

```js
function addTwo(x) {return x + 2}
function addThree(x) {return x + 3}
function addFive(x) {return x + 4}

function addTen(x) {return addFive(addTwo(addThree(x)))}
```

上面例子中，有3个函数基于一个值合成为一个函数。类似地，期约也可以像这样合成起来，渐进地消费一个值，并返回一个结果

```js
function addTen(x) {
  return Promise.resolve(x)
    .then(addTwo)
    .then(addThree)
    .then(addFive)
}
```

使用 Array.prototype.reduce() 可以写成简洁的形式

```js
function addTen(x) {
  return [addTwo, addThree, addFive]
    .reduce((promise, fn) => promise.then(fn), Promise.resolve(x))
}
```

这种模式可以提炼出一个通用函数，可以把任意多个函数作为处理程序合成一个连续传值的期约连锁。这个通用的合成函数可以这样实现

```js
function compose(...fns) {
  return x => fns.reduce((promise, fn) => promise.then(fn), Promise.resolve(x))
}

let addTen = compose(addTwo, addThree, addFive)

addTen(8).then(console.log)
```

### 期约扩展
ES6 期约实现是很可靠的，但他也有不足之处。比如，很多第三方期约库实现中具备 ECMAScript 规范中未涉及的两个特性：期约取消和进度追踪

#### 期约取消
我们经常会遇到期约正在处理程序中，程序却不再需要其结果的情形。这时候如果能够取消期约就好了。曾经也有相关提案，结果被撤回。因为 ES6 期约被认为是 “激进的”：只要期约的逻辑开始执行，就没有办法阻止到完成

实际上，可以在现有实现基础上提供一种临时性的封装，以实现取消期约的功能。这可以用到 xxx 提到的 “取消令牌”（cancel token）。生成的令牌实例提供了一个接口，利用这个接口可以取消期约；同时也提供了一个期约的实例，可以用来触发取消后的操作并求值取消状态

```js
class CancelToken {
  constructor(cancelFn) {
    this.promise = new Promise((resolve, reject) => {
      cancelFn(resolve)
    })
  }
}
```

这个类包装了一个期约，把解决方法暴露给了 cancelFn 参数。这样，外部代码就可以访问向构造函数中传入一个函数，从而控制什么情况下可以取消契约。这里期约是令牌类的公共成员，因此可以给他添加处理程序以取消期约

这个类大概可以这样使用

```html
<button id="start">start</button>
<button id="cancel">cancel</button>

<script>
class CancelToken {
  constructor(cancelFn) {
    this.promise = new Promise((resolve, reject) => {
      cancelFn(() => {
        setTimeout(console.log, 0, 'delay cancelled')
        resolve()
      })
    })
  }
}

const startButton = document.querySelector('#start')
const cancelButton = document.querySelector('#cancel')

function cancellableDelayedResolve(delay) {
  setTimeout(console.log, 0, 'set delay')

  return new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      setTimeout(console.log, 0, 'delayed resolve')
      resolve()
    }, delay)

    const cancelToken = new CancelToken((cancelCallback) => {
      cancelButton.addEventListener('click', cancelCallback)
    })

    cancelToken.promise.then(() => clearTimeout(id))
  })
}

startButton.addEventListener('click', () => cancellableDelayResolve(1000))

</script>
```

每次单击 start 按钮都会开始计时，并实例化一个新的 CancelToken 的实例。此时，cancel 按钮一旦被点击，就会触发令牌实例中的期约解决。而解决之后，单击 start 按钮设置的超时也会被取消

#### 期约进度通知
执行中的期约可能会有不少离散的“阶段”，在最终解决之前必须依次经过。某些情况下，监控期约的执行进度会很有用。ECMAScript 6期约并不支持进度追踪，但是可以通过扩展来实现

一种实现方式是扩展 Promise 类，为他添加 notify() 方法

```js
class TrackablePromise extends Promise {
  constructor(executor) {
    const notifyHandlers = []

    super((resolve, reject) => {
      return executor(resolve, reject, (status) => {
        notifyHandlers.map(handler => handler(status))
      })
    })

    this.notifyHandlers = notifyHandlers
  }

  notify(notifyHandler) {
    this.notifyHandlers.push(notifyHandler)
    return this
  }
}
```

这样，TrackablePromise 就可以在执行函数中使用 notify() 函数了。可以像下面这样使用这个函数来实例化一个期约

```js
let p = new TrackablePromise((resolve, reject, notify) => {
  function countdown(x) {
    if (x > 0) {
      notify(`${20 * x}% remaining`)
      setTimeout(() => countdown(x - 1), 1000)
    } else {
      resolve()
    }
  }

  countdown(5)
});
```

这个期约会连续5次递归设置 1000 毫秒的超时。每个超时回调都会调用 notify() 并传入状态值。假设通知处理程序简单地这样写

```js
p.notify((x) => setTimeout(console.log, 0, 'progress:', x))

p.then(() => setTimeout(console.log, 0, 'completed'))
```

notify() 函数会返回期约，所以可以连缀调用，连续添加处理程序。多个处理程序会针对收到的每条消息分别执行一次

```js
p.notify((x) => setTimeout(console.log, 0, 'a:', x))
p.notify((x) => setTimeout(console.log, 0, 'b:', x))

p.then(() => setTimeout(console.log, 0, 'completed'))
```
总体来看，这还是一个比较粗糙的实现，但应该可以演示出如何使用通知报告进度了

> 注意： ES6 不支持取消和进度通知，一个主要原因就是这样会导致期约连锁和期约合成过度复杂化。比如在一个期约连锁中，如果某个被其他期约依赖的期约呗取消了或者发出了通知，那么接下来应该发生什么完全说不清楚。毕竟，如果取消了 Promise.all() 中的一个期约，或者期约连锁中前面的期约发送了一个通知，那么接下来应该怎么办才比较合理呢？

## 异步函数
异步函数，也称为 async/await （语法关键字），是 ES6 期约模式在 ECMAScript 函数中的应用。async/await 是 ES8 规范新增的。这个特性从行为和语法上都增强了 JavaScript，让以同步方式写的代码能够异步执行

```js
let p = new Promise(resolve => setTimeout(resolve, 0, 3))
```

这个期约在 1000 毫秒之后解决为数值3.如果程序中的其他代码要在这个值可用时访问他，则需要写一个解决处理程序

```js
p.then(x => console.log(x)) // 3
```

这其实是很不方便的，因为其他代码都必须塞到期约处理程序中。不过可以把处理程序定义为一个函数

```js
function handler(x) { console.log(x) }

// ...
p.then(handler)
```

这个改进其实也不大。这是因为任何需要访问这个期约所产生值的代码，都需要以处理程序的形式接收这个值。也就是说，代码照样还是要放到处理程序中。ES8 为此提供了 async/await 关键字

### 异步函数
ES8 的 async/await 旨在解决利用异步结构组织代码的问题。为此，ECMAScript 对函数进行了扩展，为其增加了两个新关键字：async 和 await

#### async
async 关键字用于声明异步函数。这个关键字可以用在函数声明、函数表达式、箭头函数和方法上

```js
async function foo() {}

let bar = async function() {}

let baz = async () => {}

class Qux {
  async qux() {}
}
```

使用 async 关键字可以让函数具有异步特征，但总体上其代码仍然是同步求值。而在参数或闭包方面，异步函数仍然具有普通 JavaScript 函数的正常行为。正如下面所示，foo() 函数仍然会在后面的指令之前被求值

```js
async function foo() {
  console.log(1)
}

foo()
console.log(2)

// 1
// 2
```

不过，异步函数如果使用 return 关键字返回了值（如果没有 return 则返回 undefined），这个值会被 Promise.resolve() 包装成一个期约对象。异步函数始终返回期约对象。在函数外部调用这个函数可以得到他返回的期约

```js
async function foo() {
  return 1
}

foo().then(console.log) // 1
```

当然直接返回一个期约对象也是一样的

```js
async function foo() {
  return Promise.resolve(1)
}

foo().then(console.log) // 1
```

异步函数的返回值期待一个实现 thenable 接口的对象，但常规的值也可以。如果返回的是实现 thenable 接口的对象，则这个对象可以由提供给 then() 的处理程序 “解包”。如果不是，则返回值就被当作已经解决的期约

```js
// 返回一个原始值
async function foo() {
  return 1
}

foo().then(console.log) // 1

// 返回一个没有实现 thenable 接口的对象
async function bar() {
  return [1]
}

bar().then(console.log) // [1]

// 返回一个实现了 thenable 接口的非期约对象
async function baz() {
  const thenable = {
    then(callback) {callback(1)}
  }

  return thenable
}

baz().then(console.log) // 1

// 返回一个期约
async function qux() {
  return Promise.resolve(1)
}

qux().then(console.log) // 1
```

与在期约处理程序中一样，在异步函数抛出错误会返回拒绝的期约

```js
async function foo() {
  console.log(1)
  throw 3
}

// 给返回的期约添加一个拒绝处理程序
foo().catch(console.log) // 3
```

不过，拒绝期约的错误不会被异步函数捕获

```js
async function foo() {
  console.log(1)
  Promise.reject(3)
}

// Attach a rejected handler to the returned promise
foo().catch(console.log)
console.log(2)

// 1
// 2
// Uncaught (in promise): 3
```

#### await
因为异步函数主要针对不会马上完成的任务，所以自然需要一种暂停和恢复执行的能力。使用 await 关键字可以暂停异步函数代码的执行，等待期约解决。

```js
async function foo() {
  let p = new Promise(resolve => setTimeout(resolve, 1000, 3))

  console.log(await p)
}

foo()
//3
```

注意，await 关键字会暂停执行异步函数后面的代码，让出 JavaScript 运行时的执行线程。这个行为与生成器函数中的 yield 关键字是一样的。await 关键字同样是尝试 “解包” 对象的值，然后将这个值传给表达式，再异步恢复异步函数的执行

await 关键字的用法与 JavaScript 的一元操作一样。他可以单独使用，也可以在表达式中使用，如下

```js
// 异步打印 foo
async function foo() {
  console.log(await Promise.resolve('foo'))
}

foo() // foo

// 异步打印 bar
async function bar() {
  return await Promise.resolve('bar')
}

bar().then(console.log) // bar

// 1000 毫秒后异步打印 baz
async function baz() {
  await new Promise(resolve => setTimeout(resolve, 1000))
  console.log('baz')
}

baz() // baz 1000 later
```

await 关键字期待一个实现 thenable 接口的对象，但常规的值也可以。如果是实现 thenable 接口的对象，则这个对象可以由 await 来 “解包”。如果不是，则这个值就被当作已经解决的期约

```js
// 等待一个原始值
await 'foo'

// 等待一个没有实现 thenable 接口的对象

await [1] // [1]

// 等待一个实现了 thenable 接口的非期约对象

const thenable = {
  then(callback) {callback(1)}
}

await thenable() // 1

// 等待一个期约
await Promise.resolve(1)
```

等待会抛出错误的同步操作，会返回拒绝的期约

```js
async function foo() {
  console.log(1)
  await (() => {throw 3})()
  console.log(4) // 这行代码不会执行
}

// 给返回的期约添加一个处理程序
foo().catch(console.log)
console.log(2)

// 1
// 2
// 3
```

如前面的例子所示，单独的 Promise.reject() 不会被异步函数捕获，而会抛出未捕获的错误。不过，对拒绝的期约使用 await 则会释放错误值（将拒绝期约返回）

```js
async function foo() {
  console.log(1)
  await Promise.reject(3)
  console.log(4) // 这行代码不会执行
}

// 给返回的期约添加一个拒绝处理程序
foo().catch(console.log)
console.log(2)

// 1
// 2
// 3
```

#### await 的限制
await 关键字必须在异步函数中使用，不能在顶级上下文如 `<script>` 标签或模块中使用。不过，定义并立即调用异步函数是没有问题的。下面两段代码实际相同

```js
async function foo() {
  console.log(await Promise.resolve(3))
}

foo() // 3

// 立即调用的异步函数表达式
(async function() {
  console.log(await Promise.resolve(3))
})() // 3
```

此外，异步函数的特质不会扩展到嵌套函数。因此，await 关键字也只能直接出现在异步函数的定义中。在同步函数内部使用 await 会抛出 SyntaxError

```js
// false
function foo() {
  const syncFn = () => {
    return await Promise.resolve(3)
  }
}

// true
function bar() {
  const syncFn = async () => {
    return await Promise.resolve(3)
  }
}
```

### 停止和恢复执行
使用 await 关键字之后的区别其实比看上去的还要微妙一些。比如，下面的例子中按顺序调用了 3个函数，但他们的输出结果顺序是相反的

```js
async function foo() {
  console.log(await Promise.resolve('foo'))
}

async function bar() {
  console.log(await 'bar')
}

async function baz() {
  console.log('baz')
}

foo()
bar()
baz()

// baz
// bar
// foo
```

async/await 中真正起作用的是 await。async 关键字，无论从哪方面来看，都不过是一个标识符。毕竟，异步函数如果不包含 await 关键字，其执行基本上跟普通函数没有区别

要完全理解 await 关键字，必须知道他并非只是等待一个值可用那么简单。JavaScript 运行时在碰到 await 关键字时，会记录在哪里暂停。等到 await 右边的值可用了，JavaScript 运行时会向消息队列推送一个任务，这个任务会恢复异步函数的执行

因此，即使 await 后面跟着一个立即可用的值，函数的其余部分也会被异步求值。

```js
async function foo() {
  console.log(2)
  await null
  console.log(4)
}

console.log(1)
foo()
console.log(3)

// 1
// 2
// 3
// 4
```

运行时工作过程

- 打印 1
- 调用异步函数 foo()
- 在 foo() 中 打印 2
- 在 foo() 中 await 关键字暂停执行，为立即可用的值 null 向消息队列中添加一个任务
- foo() 退出
- 打印 3
- 同步线程的代码执行完毕
- JavaScript 运行时从消息队列中取出任务，恢复异步函数执行
- 在 foo() 中 恢复执行，await 取得 null 值（这里并没有使用）
- 在 foo() 中 打印 4
- foo() 返回

如果 await 后面等待的是一个期约。此时会有一个任务推到消息队列中

### 异步函数策略
因为简单实用，所以异步函数很快成为 JavaScript 项目最广泛的特性之一。不过，在使用异步函数时，有些问题要注意

#### 实现 sleep()
类似 Java 中 Thread.sleep() ，好在程序中加入非阻塞的暂停

```js
async function sleep(delay) {
  return new Promise(resolve => setTimeout(resolve, delay))
}

async function foo() {
  const t0 = Date.now()
  await sleep(1500) // 暂停约 1500 毫秒
  console.log(Date.now() - t0)
}
```

#### 利用平行执行
如果使用 await 时不留心，则很可能错过平行加速的机会。下面例子，其中顺序等待了5个随机的超时

```js
async function randomDelay(id) {
  // 延迟 0 ～ 1000 毫秒
  const delay = Math.random() * 1000
  return new Promise((resolve) => setTimeout(() => {
    console.log(`${id} finished`)
    resolve()
  }), delay)
}

async function foo() {
  const t0 = Date.now()
  await randomDelay(0)
  await randomDelay(1)
  await randomDelay(2)
  await randomDelay(3)
  await randomDelay(4)
  console.log(`${Date.now() - t0}ms elapsed`)
}

foo()

// 0 finished
// 1 finished
// 2 finished
// 3 finished
// 4 finished
```

用一个 for 循环重写

```js
// ...
async function foo() {
  const t0 = Date.now()
  for (let i = 0; i < 5; ++i) {
    await randomDelay(i)
  }
  console.log(`${Date.now() - t0}ms elapsed`)
}
// ...
```

就算这些期约之间没有依赖，异步函数也会依次暂停，等待每个超时完成。这样可以保证执行顺序，但总执行时间会变长

如果顺序不是必需保证的，那么可以先一次性初始化所有期约，然后再分别等待他们的结果。比如

```js
async function randomDelay(id) {
  // 延迟 0 ～ 1000 毫秒
  const delay = Math.random() * 1000
  return new Promise((resolve) => setTimeout(() => {
    console.log(`${id} finished`)
    resolve()
  }), delay)
}

async function foo() {
  const t0 = Date.now()

  const p0 = randomDelay(0)
  const p1 = randomDelay(1)
  const p2 = randomDelay(2)
  const p3 = randomDelay(3)
  const p4 = randomDelay(4)

  await p0
  await p1
  await p2
  await p3
  await p4

  console.log(`${Date.now() - t0}ms elapsed`)
}

foo()
```

用数组和 for 

```js
// ...
async function foo() {
  const t0 = Date.now()

  const promises = Array(5).fill(null).map((_, i) => randomDelay(i))

  for (const p of promises) {
    await p
  }

  // ....
}
// ...
```

注意，虽然期约没有按顺序执行，但 await 按顺序收到了每个期约的值

```js
async function randomDelay(id) {
  // 延迟 0 ～ 1000 毫秒
  const delay = Math.random() * 1000
  return new Promise((resolve) => setTimeout(() => {
    console.log(`${id} finished`)
    resolve(id)
  }), delay)
}

async function foo() {
  const t0 = Date.now()

  const promises = Array(5).fill(null).map((_, i) => randomDelay(i))

  for (const p of promises) {
    console.log(`awaited ${await p}`)
  }
}

// 1 finished
// 2 finished
// 4 finished
// 0 finished
// 3 finished

// awaited 0
// awaited 1
// awaited 2
// awaited 3
// awaited 4
```

#### 串行执行期约
之前讨论过如何串行执行期约并把值传给后续的期约。使用 async/await，期约连锁会变得很简单

```js
function addTwo(x) {return x + 2}
function addThree(x) {return x + 3}
function addFive(x) {return x + 5}

async function addTen(x) {
  for (const fn of [addTwo, addThree, addFive]) {
    x = await fn(x)
  }
  return x
}

addTen(9).then(console.log) // 19
```

这里，await 直接传递了每个函数的返回值，结果通过迭代产生。当然，这个例子并没有使用期约，如果要使用期约，则可以把所有函数都改成异步函数，这样他们就都返回了期约

```js
async function addTwo(x) {return x + 2}
async function addThree(x) {return x + 3}
async function addFive(x) {return x + 5}

async function addTen(x) {
  for (const fn of [addTwo, addThree, addFive]) {
    x = await fn(x)
  }
  return x
}

addTen(9).then(console.log) // 19
```

#### 栈追踪与内存管理
期约与异步函数的功能有相当程度的重叠，但他们在内存中的表示则差别很大。看看下面例子，他展示了拒绝期约的栈追踪信息

```js
function fooPromiseExecutor(resolve, reject) {
  setTimeout(reject, 1000, 'bar')
}

function foo() {
  new Promise(fooPromiseExecutor)
}

foo()

// Uncaught (in promise) bar
// setTimeout
// setTimeout (async)
// fooPromiseExecutor
// foo
```

根据对期约的不同理解程度，以上栈追踪信息可能会让某些读者不解。栈追踪信息应该相当直接地表现 JavaScript 引擎当前栈内存中函数调用之间的嵌套关系。在超时处理程序执行时和拒绝期约时，我们看到的错误信息包含嵌套函数的标识符，那是被调用以创建最初期约实例的函数。可是，我们知道这些函数已经返回了，因此栈追踪信息中不应该看到他们

答案很简单，这是因为 JavaScript 引擎会在创建期约时尽可能保留完整的调用栈。在抛出错误时，调用栈可以由运行时的错误处理逻辑获取，因而就会出现在栈追踪信息中。当然，这意味着栈追踪信息会占用内存，从而带来一些计算和存储成本

如果在前面的例子中使用异步函数，会怎样呢

```js
function fooPromiseExecutor(resolve, reject) {
  setTimeout(reject, 1000, 'bar')
}

async function foo() {
  await new Promise(fooPromiseExecutor)
}

foo()

// Uncaught (in promise) bar
// foo
// async function (async)
// foo
```

这样一改，栈信息就准确地反映了当前的调用栈。fooPromiseExecutor() 已经返回，所以他不在错误信息中。但 foo() 此时被挂起了，并没有退出。JavaScript 运行时可以简单地在嵌套函数中存储指向包含函数的指针，就跟对待同步函数调用栈一样。这个指针实际上存储在内存中，可用于在出错时生成栈追踪信息。这样就不会像之前的例子那样带来额外的消耗，因此在重视性能的应用是可以优先考虑的

## 小结
期约的主要功能是为异步代码提供了清晰的抽象。可以用期约表示异步执行的代码块，也可以用期约表示异步计算的值。在需要串行异步代码时，期约的价值最为突出。作为可塑性极强的一种结构，期约可以被序列化、连锁使用、符合、扩展和重组

异步函数是将期约应用于 JavaScript 函数的结果。异步函数可以暂停执行，而不阻塞主线程。无论是编写基于期约的代码，还是组织串行和平行执行的异步代码，使用异步函数都非常得心应手。异步函数可以说是现代 JavaScript 工具箱中最重要的工具之一