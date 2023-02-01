# 客户端存储
## cookie
HTTP cookie 通常也叫做 cookie，最初用于客户端存储会话信息。这个规范要求服务器在响应 HTTP 请求时，通过发送 Set-Cookie HTTP 头部包含会话信息。

```
HTTP/1.1 200 OK
Content-type: text/html
Set-Cookie: name=value
Other-header: other-header-value
```

这个 HTTP 响应会设置一个名为 “name”，值为 “value” 的 cookie。名和值在发送时都会经过 URL 编码。浏览器会存储这些会话信息，并在之后的每个请求中都会通过 HTTP 头部 cookie 再将它们发回服务器

```
GET /index.js1 HTTP/1.1
Cookie: name=value
Other-header: other-header-value
```

这些发送回服务器的额外信息可用于唯一标识发送请求的客户端

### 限制
cookie 是与特定域绑定的。设置 cookie 后，他会与请求一起发送到创建他的域。这个限制能保证 cookie 中存储的信息只对被认可的接收者开放，不被其他域访问

因为 cookie 存储在客户端机器上，所以为保证他不会被恶意利用，浏览器会施加限制。同时，cookie 也不会占用太多磁盘空间

通常，只要遵守以下大致的限制，就不会在任何浏览器中碰到问题

- 不超过 300个 cookie
- 每个 cookie 不超过 4096字节 (4kb)
- 每个域不超过 20个 cookie
- 每个域不超过 81920 字节 (80kb)

每个域能设置的 cookie 总数也是受限的，但不同浏览器的限制不同

- 最新版 IE 和 EDGE 限制每个域不超过 50个 cookie
- 最新版 Firefox 限制每个域不超过 150个 cookie
- 最新版 Opera 限制每个域不超过 180个 cookie
- Safari 和 Chrome 对每个域的 cookie 数没有硬性限制

如果 cookie 总数超过了单个域的上限，浏览器就会删除之前设置的 cookie。

浏览器也会限制 cookie 的大小。大多数浏览器对 cookie 的限制是不超过 4096字节，上下可以有一个字节的误差。为跨浏览器兼容，最好保证 cookie 的大小不超过 4095 字节。这个大小限制适用于一个域的所有 cookie，而不是单个 cookie

如果创建的 cookie 超过最大限制，则该 cookie 会静默删除。注意，一个字符通常会占 1字节。如果使用多字节字符（UTF-8 Unicode 字符），则每个字符最多可能占 4字节

### cookie 的构成
cookie 在浏览器中是由以下参数构成的

- 名称：唯一标识 cookie 的名称。cookie 名不区分大小写。cookie 名必须经过 URL 编码
- 值：存储在 cookie 里的字符串值。这个值必须经过 URL 编码
- 域：cookie 有效的域。发送到这个域的所有请求都会包含对应的 cookie。这个值可能包含子域，也可以不包含
- 路径：请求 URL 中包含这个路径才会把 cookie 发送到服务器。例如，可以指定 cookie 只能由 https://xxx.com/books/ 访问，因此访问 https://xx.com 下的页面就不会发送 cookie，即使请求的是同一个域
- 过期时间：表示何时删除 cookie 的时间戳（即什么时间之后就不发送到服务器了）。默认情况下，浏览器会话结束后会删除所有 cookie。不过，也可以设置删除 cookie 的时间。这个值是 GMT 格式，用于指定删除 cookie 的具体时间。这样即使关闭浏览器 cookie 也会保留在用户机器上。把过期时间设置为过去的时间会立即删除 cookie
- 安全标志：设置之后，只在使用 SSL 安全连接的情况下才会把 cookie 发送到服务器

这些参数在 Set-Cookie 头部中使用分号加空格隔开

```
Set-Cookie: name=value; expires=Mon, 22-Jan-07 07:10:22 GMT; domain=.xxx.com
```

这个头部设置一个名为 name 的 cookie，这个 cookie 在 2007年1月7日 7:10:22过期，对 xxx.com 及其他 xxx.com 的子域（如 p2p.xxx.com） 有效

安全标志 secure 是 cookie 中唯一的非名/值对，只需一个 secure 就可以了

```
Set-Cookie: name=value; secure; path=/
```

要知道，域、路径、过期时间和 secure 标志用于告诉浏览器什么情况下应该在请求中包含 cookie，这些参数并不会随着请求发送给服务器，实际发送的只有 cookie 的名/值对

### JavaScript 中的 cookie
在 JavaScript 中处理 cookie 比较麻烦，因为接口过于简单，只有 BOM 的 document.cookie 属性。根据用法不同，该属性的表现迥异。要使用该属性获取值时，document.cookie 返回包含页面中所有有效 cookie 的字符串（根据域、路径、过期时间和安全设置），以分号分隔

```
name1=value1;name2=value2;name3=value3
```

所有名和值都是 URL 编码的，因此必须使用 decodeURIComponent() 解码

在设置值时，可以通过 document.cookie 属性设置新的 cookie 字符串。这个字符串在被解析后会添加到原有 cookie 中。设置 document.cookie 不会覆盖之前存在的任何 cookie，除非设置了已有的 cookie。设置 cookie 的格式如下，与 Set-Cookie 头部的格式一样

```
name=value; expires=expiration_time; path=domain_path; domain=domain_name; secure
```

在所有这些参数中，只有 cookie 的名称和值是必须的。

```
document.cookie = "name=value"
```

这行代码会创建一个名为 "name" 的会话 cookie，其值为 "value"。这个 cookie 在每次客户端向服务器发送请求时都会被带上，在浏览器关闭时就会被删除。虽然可以直接设置，最好还是使用 encodeURIComponent() 对名称和值进行编码

```
document.cookie = encodeURIComponent('name') + '=' + encodeURIComponent('value')
```

### 使用 cookie 的注意事项
还有一种叫 HTTP-only 的 cookie。HTTP-only 可以在浏览器设置，也可以在服务器设置，但只能在服务器上读取，这是因为 JavaScript 无法取得这种 cookie 的值

因为所有 cookie 都会作为请求头部由浏览器发送给服务器，所以在 cookie 中保存大量信息可能会影响特点域浏览器请求的性能。保存的 cookie 越大，请求完成的时间就越长。即使浏览器对 cookie 大小由限制，最好还是尽可能只通过 cookie 保存必要信息，以避免性能问题

对 cookie 的限制及其特性决定了 cookie 并不是存储大量数据的理想方式。因此，其他客户端存储技术出现了

> 注意：不要在 cookie 中存储重要或敏感信息。cookie 数据不是保存在安全的环境中，因此任何人都可能获得。应该避免把信用卡号或个人地址等信息保存在 cookie 中。

## Web Storage
Web Storage 的目的是解决通过客户端存储不需要频繁发送回服务器的数据时使用 cookie 的问题

- 提供在 cookie 之外的存储会话数据的途径
- 提供跨会话持久化存储大量数据的机制

### Storage 类型
Storage 类型用于保存名/值对数据，直至存储空间上限（由浏览器决定）。Storage 的实例与其他对象一样，但增加了以下方法

- clear() 删除所有值；不在 Firefox 中实现
- getItem(name) 取得给定 name 的值
- key(index) 取得给定数值位置的名称
- removeItem(name) 删除给定 name 的名/值对
- setItem(name, value) 设置给定 name 的值

通过 length 属性可以确定 Storage 对象中保存了多少名/值对。我们无法确定对象中所有数据占用的空间大小，尽管 IE8 提供了 remainingSpace 属性，用于确定还有多少存储空间（以字节计）可用

> 注意：Storage 类型只能存储字符串。非字符串数据在存储之前会自动转换为字符串。注意，这种转换不能在获取数据时撤销

### sessionStorage 对象
sessionStorage 对象只存储会话数据（当前窗口），这意味着数据只会存储到浏览器关闭。这跟浏览器关闭时会消失的会话 cookie 类似。存储在 sessionStorage 中的数据不受页面刷新影响，可用在浏览器崩溃并重启后恢复（取决于浏览器）

因为 sessionStorage 对象是 Storage 的实例，所以可用通过使用 setItem() 方法或直接给属性赋值给他添加数据。

要从 sessionStorage 中删除数据，可用通过 delete 操作符志杰删除对象属性，也可以使用 removeItem() 方法

sessionStorage 对象应该主要用于存储只在会话期间有效的小块数据。如果需要跨会话持久存储数据，可以使用 localStorage

### localStorage 对象
在修订的 HTML5 规范里，localStorage 对象取代了 globalStorage，作为在客户端持久存储数据的机制。要访问同一个 localStorage 对象，页面必须来自同一个域（子域不可以）、在相同的端口上使用相同的协议

因为 localStorage 是 Storage 的实例，所以可以像使用 sessionStorage 一样使用 localStorage。

两种存储方法的区别在于，存储在 localStorage 中的数据会保留到通过 JavaScript 删除或者用户清除浏览器缓存。localStorage 数据不受页面刷新影响，也不会因关闭窗口、标签页或重启浏览器而丢失

### 存储事件
每当 Storage 对象发生变化时，都会在文档上触发 storage 事件。使用属性或 setItem() 设置值、使用 delete 或 removeItem() 删除值，以及每次调用 clear() 时都会触发这个事件。这个事件的事件对象有如下4个属性

- domain 存储变化对应的域
- key 被设置或删除的键
- newValue 键被设置的新值，若键被删除则为 null
- oldValue 键变化之前的值

### 限制
与其他客户端数据存储方案一样，Web Storage 也有限制。具体的限制取决于特定的浏览器。一般来说，客户端数据的大小限制是每个源（协议、域和端口）来设置的，因此每个源有固定大小的数据存储空间。分析存储数据的页面的源可以加强这一限制

不同浏览器给 localStorage 和 sessionStorage 设置了不同的空间限制，但大多数会限制为每个源 5MB

## IndexedDB
Indexed Database，是浏览器中存储结构化数据的一种方案。IndexedDB 用于代替目前已废弃的 Web SQL Database API。IndexedDB 背后的思想是创造一套 API，方便 JavaScript 对象的存储和获取，同时也支持查询和搜索

IndexedDB 的设计几乎完全是异步的。为此，大多数操作以请求的形式执行，这些请求会异步执行，产生成功的结果或错误。绝大多数 IndexedDB 操作要求添加 onerror 和 onsuccess 事件处理程序来确定输出

2017年，新发布的主流浏览器 （Chrome、Firefox、Opera、Safari）完全支持 IndexedDB。IE10/11 和 Edge 浏览器部分支持 IndexedDB