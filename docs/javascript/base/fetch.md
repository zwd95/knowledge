# Fetch API
Fetch API 能够执行 XMLHttpRequest 对象的所有任务，但更容易使用，接口也更现代化，能够在 Web 工作线程等现代 Web 工具中使用。XMLHttpRequest 可以选择异步，而 Fetch API 则必须是异步

Fetch API 是 WHATWG 的一个 “活标准”，用规范原文说，就是 “Fetch 标准定义请求、响应，以及绑定二者的流程：获取（fetch）”

Fetch API 本身是使用 JavaScript 请求资源的优秀工具，同时这个 API 也能够应用在服务线程 （service worker）中，提供拦截、重定向和修改通过 fetch() 生成的请求接口

## 基本用法
fetch() 方法是暴露在全局作用域中，包括主页面执行线程、模块和工作线程。调用这个方法，浏览器就会向给定 URL 发送请求

### 分派请求
fetch() 只有一个必须的参数 input。多数情况下，这个参数是要获取资源的 URL。这个方法返回一个期约

```js
let r = fetch('/bar')

console.log(r) // Promise <pending>
```

URL 的格式（相对路径、绝对路径等）的解释与 XHR 对象一样

请求完成、资源可用时，期约会解决为一个 Response 对象。这个对象是 API 的封装，可以通过他取得相应的资源。获取资源要使用这个对象的属性和方法，掌握响应的情况并将负载转换为有用的形式

```js
fetch('bar.txt')
  .then(response => {
    console.log(response)
  })

  // Response { type: 'basic', url: ... }
```

### 读取响应
读取响应内容的最简单方式是取得纯文本格式的内容，这要用到 text() 方法。这个方法返回一个期约，会解决为取得资源的完整内容

```js
fetch('./data-type.md')
  .then(response => {
    response.text().then(data => {
      console.log(data);
    })
  })
```

内容的结构通常是打平的

```js
fetch('./data-type.md')
  .then(response => response.text())
  .then(data => console.log(data))
```

### 处理状态码和请求失败
Fetch API 支持通过 Response 的 status（状态码）和 statusText（状态文本）属性检查响应状态。成功获取响应的请求通常会产生值为 200的状态码

```js
fetch('./data-type.md')
  .then(response => {
    console.log(response.status); // 200
    console.log(response.statusText); // OK
  })
```

请求不存在的资源通常会产生 404的状态码

```js
fetch('xxx')
  .then(response => {
    console.log(response.status); // 404
    console.log(response.statusText); // Not Found
  })
```

请求的 URL 如果抛出服务器错误会产生值为 500的状态码

```js
fetch('http://xxxx')
  .then(response => {
    console.log(response.status); // 500
    console.log(response.statusText); // Internal Server Error
  })
```

可以显式地设置 fetch() 在遇到重定向时的行为，不过默认行为是跟随重定向并返回状态码不是 300 ～ 399 的响应。跟随重定向时，响应对象的 redirected 属性会被设置为 true，而状态码仍然是 200

```js
fetch('/something-redirect')
  .then(response => {
    // 默认行为是跟随重定向直到最终 URL
    // 这个例子会出现至少两轮网络请求
    // <origin url> /something-redirect -> <redirect url>
    console.log(response.status) // 200
    console.log(response.statusText) // OK
    console.log(response.redirected) // true
  })
```

在前面这几个例子中，虽然请求可能失败（如状态码 500），但都只执行了期约的解决处理阐述。事实上，只要服务器返回了响应，fetch() 期约都会解决。这个行为是合理的：系统级网络协议已经成功完成消息的一次往返传输。至于真正的“成功”请求，则需要在处理响应时再定义

通常状态码 200 时就会被认为成功了，其他情况可以被认为未成功。为区分两种情况，可以在状态码非 200 ～ 299时检查 Response 对象的 ok 属性

```js
fetch('./data-type.md')
  .then(response => {
    console.log(response.status); // 200
    console.log(response.statusText); // OK
    console.log(response.ok) // true
  })

fetch('xxx')
  .then(response => {
    console.log(response.status); // 404
    console.log(response.statusText); // Not Found
    console.log(response.ok) // false
  })
```

因为服务器没有响应而导致浏览器超时，这样真正的 fetch() 失败会导致期约被拒绝

```js
fetch('xxxx')
  .then(response => {
    console.log(response)
  }, (err) => {
    console.log(err)
  })

// 浏览器超时后
// TypeError: 'NetworkError when attempting to fetch resource'
```

违反 CORS、无网络连接、HTTPS 错配及其他浏览器/网络策略问题都会导致期约被拒绝。可以通过 url 属性检查通过 fetch() 发送请求时使用的完整 URL

```js
fetch('./data-type.md')
  .then(response => {
    console.log(response.url);
  })
```

### 自定义选项
只使用 URL 时，fetch() 会发送 GET 请求，只包含最低限度的请求头。要进一步配置如何发送请求，需要传入可选的第二个参数 init 对象。

- body 
- 指定使用请求体时请求体的内容
- 必须是 Blob、BufferSource、FormData、URLSearchParams、ReadableStream 或 String 的实例

- cache
- 用于控制浏览器与HTTP缓存的交互。要跟踪缓存的重定向，请求的 redirect 属性值必须是 follow，而且必须符合同源策略限制。必须是下列值之一
- Default
  - fetch() 返回命中的有效缓存。不发送请求
  - 命中无效 （state）缓存会发送条件式请求。如果响应已经改变，则更新缓存的值。然后 fetch() 返回缓存的值
  - 未命中缓存会发送请求，并缓存响应。然后 fetch() 返回响应
- no-store
  - 浏览器不检查缓存，直接发送请求
  - 不缓存响应，直接通过 fetch() 返回
- reload
  - 浏览器不检查缓存，直接发送请求
  - 缓存响应，再通过 fetch() 返回
- no-cache
  - 无论命中有效缓存还是无效缓存都会发送条件式请求。如果响应已经改变，则更新缓存的值。然后 fetch() 返回缓存的值
  - 未命中缓存会发送请求，并缓存响应。然后 fetch() 返回响应
- force-cache
  - 无论命中有效缓存还是无效缓存都通过 fetch() 返回，不发送请求
  - 未命中缓存会发送请求，并缓存响应。然后 fetch() 返回响应
- only-if-cached
  - 只在请求模式为 same-origin 时使用缓存
  - 无论命中有效缓存还是无效缓存都通过 fetch() 返回，不发送请求
  - 未命中缓存返回状态码 504（网关超）的响应

默认为 default

## 常见 Fetch 请求模式
与 XHR 一样，fetch() 既可以发送数据也可以接收数据。使用 init 对象参数，可以配置 fetch() 在请求体中发送各种序列化的数据

### 发送 JSON 数据
```js
    let payload = JSON.stringify({
      foo: 'bar'
    })

    let jsonHeaders = new Headers({
      'Content-Type': 'application/json'
    });

    fetch('/send-json', {
      method: 'POST', // 发送请求体时必须使用一种 HTTP 方法
      body: payload,
      headers: jsonHeaders
    });
```

### 在请求体中发送参数
因为请求体支持任意字符串，所以可以通过他发送请求参数

```js
    let payload = 'foo=bar&baz=qux';

    let paramHeaders = new Headers({
      'Content-Type': 'application/w-www-form-urlencoded; charset=UTF-8'
    });

    fetch('/send-params', {
      method: 'POST',
      body: payload,
      headers: paramHeaders
    });
```

### 发送文件
因为请求体支持 FormData 实现，所以 fetch() 也可以序列化并发送文件字段中的文件

```js
    let imageFormData = new FormData();
    let imageInput = document.querySelector("input[type='file']")

    imageFormData.append('image', imageInput.files[0])

    fetch('/img-upload', {
      method: 'POST',
      body: imageFormData
    });
```

这个 fetch() 实现可以支持多个文件

```js
    let imageFormData = new FormData();
    let imageInput = document.querySelector("input[type='file'][multiple]")

    for (let i = 0; i < imageInput.files.length; ++i) {
      imageFormData.append('image', imageInput.files[i])
    }

    fetch('/img-upload', {
      method: 'POST',
      body: imageFormData
    });
```

### 加载 Blob 文件
Fetch API 也能提供 Blob 类型的响应，而 Blob 又可以兼容多种浏览器 API。一种常见的做法是明确将图片文件加载到内存，然后将其添加到 HTML 图片元素。为此，可以使用响应对象上暴露的 blob() 方法。这个方法返回一个期约，解决为一个 Blob 的实例。然后，可以将这个实例传给 URL.createObjectUrl() 以生成可以添加给图片元素 src 属性的值

```js
    const imageElement = document.querySelector('img')

    fetch('xx.png')
      .then(response => response.blob())
      .then(blob => {
        imageElement.src = URL.createObjectURL(blob)
      })
```

### 发送跨源请求
从不同的源请求资源，响应要包含 CORS 头部才能保证浏览器收到响应。没有这些头部，跨源请求会失败并抛出错误

```js
fetch('//cross-origin.com')
// TypeError: Failed to fetch
// No 'Access-Control-Allow-Origin' header is present on the requested resource
```

如果代码不需要访问响应，也可以发送 no-cors 请求。此时响应的 type 属性值为 opaque，因此无法读取响应内容。这种方式适合发送探测请求或者将响应缓存起来供以后使用

```js
fetch('//cross-origin.com', { method: 'no-cors' })
  .then(response => console.log(response.type))
  // opaque
```

### 中断请求
Fetch API 支持通过 AbortController/AbortSignal 对中断请求。调用 AbortController.abort() 会中断所有网络传输，特别适合希望停止传输大型负载的情况。中断进行中的 fetch() 请求会导致包含错误的拒绝

```js
    let abortController = new AbortController();

    fetch('xxx.zip', { signal: abortController.signal })
      .catch(() => console.log('aborted!'))

    // 10 毫秒后中断请求
    setTimeout(() => abortController.abort(), 10)

    // 已经中断
```

## Headers 
Headers 对象是所有外发请求和入站响应头部的容器。每个外发的 Request 实例都包含一个空的 Headers 实例，可以通过 Request.prototype.headers 访问，每个入站 Response 实例也可以通过 Response.prototype.headers 访问包含着头部的 Headers 对象。这两个属性都是可修改属性。另外，使用 new Headers() 也可以创建一个新实例。

### Headers 与 Map 的相似之处
Headers 对象与 Map 对象极为相似。这是合理的，因为 HTTP 头部本质上是序列化后的键/值对，他们的 JavaScript 表示则是中间接口。Headers 与 Map 类型都有 get()、set()、has() 和 delete() 等实例方法，

而且，他们也都有相同的 keys()、values() 和 entries() 迭代接口

### Headers 独有的特性
Headers 并不是与 Map 处处都一样。在初始化 Headers 对象时，也可以使用键/值对形式的对象，而 Map 则不可以

```js
let seed = {foo: 'bar'}
let h = new Headers(seed)

let m = new Map(seed)
// TypeError: object is not iterable
```

一个 HTTP 头部字段可以有多个值，而 Headers 对象通过 append() 方法支持添加多个值。在 Headers 实例中还不存在的头部上调用 append() 方法相当于调用 set()。后续调用会以逗号为分隔符拼接多个值

```js
let h = new Headers()
h.append('foo', 'bar')
console.log(h.get('foo')) // bar

h.append('foo', 'baz')
console.log(h.get('foo')) // bar, baz
```

## Request 对象
顾名思义，Request 对象是获取资源请求的接口。这个接口暴露了请求的相关信息，也暴露了使用请求体的不同方式

### 创建 Request 对象
可以通过构造函数初始化 Request 对象。为此需要传入一个 input 参数，一般是 URL

```js
let r = new Request('https://....')
```

Request 构造函数也接收第二个参数，一个 init 对象，这个 init 对象与前面介绍的 fetch() 的 init 对象一样。没有在 init 对象中涉及的值会使用默认值

```js
let r = new Request('https://...', { method: 'POST' })
```

### 克隆 Request 对象
Fetch API 提供了两种不太一样的方式用于创建 Request 对象的副本：使用 Request 构造函数和使用 clone() 方法

将 Request 实例作为 input 参数传给 Request 构造函数，会得到该请求的一个副本

如果再传入 init 对象，则 init 对象的值会覆盖对象中同名的值

这种克隆方式并不能总得到一模一样的副本，最明显的是，第一个请求的请求体会被标记为 “已使用”

```js
let r1 = new Request('http://...', { method: 'POST', body: 'xxx' })
let r2 = new Request(r1)

console.log(r1.bodyUsed) // true
console.oog(r2.bodyUsed) // false
```

如果源对象与创建的新对象不同源，则 referrer 属性会被清除。此外，如果源对象的 mode 为 navigate，则会被转换为 same-origin

第二种克隆 Request 对象的方式是使用 clone() 方法，这个方法会创建一模一样的副本，任何值都不会被覆盖。与第一种方式不同，这种方法不会将任何请求的请求体标记为 “已使用”

```js
let r1 = new Request('https://...')
let r2 = r1.clone()
```

如果请求对象的 bodyUsed 属性为 true（即请求体已被读取），那么上述任何一种方式都不能用来创建这个对象的副本。在请求体被读取之后再克隆会导致抛出 TypeError

### 在 fetch() 中使用 Request 对象
fetch() 和 Request 构造函数拥有相同的函数签名并不是巧合。在调用 fetch() 时，可以传入已经创建好的 Request 实例而不是 URL。与 Request 构造函数一样，传给 fetch() 的init 对象会覆盖传入请求对象的值

fetch() 会在内部克隆传入的 Request 对象，与克隆 Request 一样，fetch() 也不能拿请求体已经用过的 Request 对象来发送请求

关键在于，通过 fetch 使用 Request 会将请求体标记为已使用。也就是说，有请求体的 Request 只能在一次 fetch 中使用。

要想基于包含请求体的相同 Request 对象多次调用 fetch() ，必须在第一次发送 fetch() 请求前调用 clone()

## Response 对象
顾名思义，Response 对象是获取资源响应的接口。这个接口暴露了响应的相关信息，也暴露了使用响应体的不同方式