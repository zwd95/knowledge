# 面试题集01
## 对语义化的理解
语义化就是正确的标签做正确的事。语义化的好处在于

- 对于开发团队而言，代码更加容易维护
- 在 css 没有加载出来的情况下也能很有的展示结构
- 有利于 SEO 优化
- 更好地支持各种终端，例如无障碍阅读和有声小说等

## HTML5有哪些语义化标签
常用的语义化标签有

- header：定义页眉信息
- nav：导航栏
- section：页面的组成部分
- footer：脚注信息
- aside：侧边栏信息，比如菜单或者广告等

## less 多处用到 px 转换为 vw 如何实现
sass 中可以定义函数，接收参数并且返回计算值

```scss
// 比如：在父元素字体大小为 12px 的容器内绘制图形交互
@function pxToEm ($px) {
  @return ($px/12) + em;
}

# Sass
.box {
  width: pxToEm(36);
}

# CSS
.box {
  width: 3em;
}
```

less 中函数是内置的不能够自定义，所以可以使用混入

```less
// 将宽度 375px 的 ui 设计稿转换成使用单位 vw 来适配移动端的网页
.pxToVW (@px, @attr: width) {
  @vw: (@px / 375) * 100;
  @{attr}: ~"@{vw}vw";
}

# Less
.box {
  .pxToVW(75);
  .pxToVW(150, height);
}

# CSS
.box {
  width: 20vw;
  height: 40vw;
}
```

## vue-router 中 router 和 route 的区别
router 是路由实例对象，包含一些路由的跳转方法

route 是路由信息对象，包含和路由相关的一些信息，比如 params location 等

## vue-router hash 模式
hash 模式是 vue-router 的默认模式。hash 指的是 url 锚点，当锚点发生变化的时候，浏览器只会修改访问历史记录，不会访问服务器重新获取页面。因此可以监听锚点值的变化，根据锚点值渲染指定 dom。

### 改变锚点
可以通过 location.hash = "/path" 的方式修改浏览器的 hash 值

### 监听锚点变化
可以通过监听 hashchange 事件监听 hash 值的变化

```js
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.substr(1)
  // 根据 hash 值渲染不同的 DOM
})
```

## history 模式
通过 mode 选项开启 history 模式，history 模式和 hash 模式的区别在于

- history 模式中不带有 “#”，更美观
- history 模式当用户刷新或直接输入地址时会向服务器发送一个请求，所以 history 模式需要服务端的支持，将路由都重定向到根路由

### 改变 url
H5 的 history 对象提供了 pushState 和 replaceState 两个方法，当调用这两个方法的时候，url 会发生变化，浏览器访问历史也会发生变化，但是浏览器不会向后台发送请求

```js
// 第一个参数：data 对象，在监听变化的事件中能够获取到
// 第二个参数：title 标题
// 第三个参数：跳转地址
history.pushState({}, 'title', '/a')
```

### 监听 url 变化
可以通过监听 popState 事件监听 history 变化，也就是点击浏览器的前进或者后退功能时触发

```js
window.addEventListener('popState', () => {
  const path = window.location.pathname
})
```

从某种程度来说，调用 pushState() 和 window.location = '#foo' 基本上一样，他们都会在当前的 document 中创建和激活一个新的历史记录。但是 pushState() 有以下优势

- 新的 URL 可以是任何与当前 URL 同源的 URL。但是设置 window.location 只会在你只设置锚的时候才会使用当前 URL
- 非强制修改 URL。相反，设置 window.location = '#foo' 仅仅会在锚的值不是 #foo 情况下创建一条新的历史记录
- 可以在新的历史记录中关联任何数据。window.location = '#foo' 形式的操作，你只可以将所需数据写入锚的字符串中

注意：pushState() 不会造成 hashchange 事件调用，即使新的 URL 和之前的 URL 只是锚的数据不同

## vue 在页面中如何监听回到上一步的操作
挂载完成后，判断浏览器是否支持 popState

```js
mounted() {
  if (window.history && window.history.pushState) {
    history.pushState(null, null, document.URL)
    window.addEventListener('popstate', this.goBack, false)
  }
}
```

页面销毁时，取消监听。否则其他 vue 路由页面也会被监听

```js
destroyed() {
  window.removeEventListener('popstate', this.goBack, false)
}
```

页面跳转函数

```js
methods: {
  goBack() {
    this.$router.replace({path: '/'})
    // replace 替换原路由，作用是避免回退死循环
  }
}
```

## 回文字符串
```js
function checkStr(str) {
  return str === str.split('').reverse().join('')
}
```

## 命名方式中划线改小驼峰
```js
function turnName(str) {
  return str.replace(/-[a-zA-Z]/g, match => match.replace('-', '').toUpperCase())
}
```

## 命名方式小驼峰改中划线
```js
const str = 'aBBcdE'
const result = str.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)
```

## 前端性能优化
### 页面渲染优化
Webkit 渲染引擎流程

- 处理 HTML 并构建 DOM 树
- 处理 CSS 构建 CSS 规则树（CSSOM）
- DOM Tree 和 CSSOM Tree 合成一颗渲染树 Render Tree
- 根据渲染树来布局，计算每个节点的位置
- 调用 GPU 绘制，合成图层，显示在屏幕上

1. 避免 css 阻塞：css 影响 renderTree 的构建，会阻塞页面的渲染，因此应该尽早（将 CSS 放在 head 标签里）和尽快（启用 CDN 实现静态资源加载速度优化）的加载 css 资源

2. 避免 js 阻塞：js 可以修改 CSSOM 和 DOM，因此 js 会阻塞页面的解析和渲染，并且会等待 css 资源的加载。也就是说 js 会抢走渲染引擎的控制权。通常将 js 资源放在 body 内容后，或者给 script 标签添加 defer or async 属性
  
- defer
  - defer 脚本的下载和执行都不会阻塞页面的解析渲染。defer 脚本会在后台进行下载，此时不会阻塞页面渲染，当脚本下载完成后且页面解析渲染完成后，才会执行 defer 脚本
- async
  - async 脚本的下载不会阻塞页面的解析渲染。async 脚本的执行会阻塞页面的解析渲染

3. 使用字体图标 iconfont 代替图片图标
  - 图片会增加网络请求次数，从而拖慢页面的加载时间
  - iconfont 可以很好的缩放并且不会添加额外的请求

4. 降低 css 选择器的复杂度：浏览器读取选择器遵循的原则是从选择器的右边到左边读取
  - 减少嵌套：最多不要超过三层，并且后代选择器的开销较高，慎重选择
  - 避免使用通配符，对用到的元素进行匹配即可
  - 利用继承，避免重复匹配和定义
  - 正确使用类选择器和 id 选择器

5. 减少重绘和回流
  - CSS
    - 避免使用 table 布局
    - 尽可能在 DOM 树的最末端改变 class
    - 避免设置多层内联样式
    - 将动画效果应用到 position 属性为 absolute 或 fixed 的元素上
    - 避免使用 CSS 表达式
  - JavaScript
    - 避免频繁操作样式，最好一次性重写 style 属性，或者将样式列表定义为 class 并一次性更改 class 属性
    - 避免频繁操作 DOM，创建一个 documentFragment，在他上面应用所有 DOM 操作，最后再把他添加到 DOM 中
    - 为元素设置 display: none; 操作结束后再把他显示出来。因为在 display 属性为 none 的元素上进行 DOM 操作不会引发回流和重绘。用一次回流替代多次回流
    - 避免频繁读取会引发回流/重绘的属性，如需多次使用，用变量缓存起来。
    - 对具有复杂动画的元素生成一个新图层

  - 回流
    - 回流（reflow）指的是当 render tree 中的一部分（或全部）因为元素的规模尺寸，布局，隐藏等改变而需要重新构建，即渲染树需要重新计算
    - 也就是说，回流是指 DOM 的变化影响到了元素的几何属性（宽和高），浏览器会重新计算元素的几何属性，会使渲染树中受到影响的部分失效，浏览器会验证 DOM 树上的所有其他节点的 visibility 属性，因此，回流是低效的
    - 每个页面至少需要一次回流，就是在页面第一次加载的时候
    - 在回流的时候，浏览器会使渲染树中受到影响的部分失效，并重新构造这部分渲染树，完成回流后，浏览器会重新绘制受影响的部分到屏幕中，该过程称为重绘

  - 重绘
    - 重绘指的是当 render  tree 中的一些元素需要更新属性，而这些属性只是影响元素的外观，风格，而不会影响布局，比如 background-color，visibility，outline 等
    - 重绘不会带来重新布局，并不一定伴随回流（重排）
  
  - 两者关系
    - 回流必将引起重绘，而重绘不一定引起回流
    - 如果回流的频率较高，CPU 使用率会大大提高。一个元素的重排通常会带来一系列的反应，甚至触发整个文档的重排和重绘，性能代价高昂

  
### 页面呈现的具体过程（同上类似）
1. 浏览器把获取到 HTML 代码解析成一个 DOM 树，HTML 中的每个 tag 都是 DOM 树中的一个节点，根节点就是我们常用的 document 对象
  - DOM 树里包含所有 HTML 标签，包含使用了 display: none 的元素，还有用 JS 动态添加的元素
2. 浏览器把所有样式（用户定义的 CSS 和用户代理）解析成样式结构体（CSSOM 树），在解析的过程中会去掉浏览器不能识别的样式
3. DOM 树和样式结构体（CSSOM 树）组合后构建 render tree
  - render tree 类似于 DOM Tree，但区别很大
  - render tree 能识别样式，render tree 每个 NODE 都有自己的 style，而且 render tree 不包含隐藏的节点（display: none 的节点，还有 head 节点）。因为这些节点不会用于呈现，而且不会影响呈现。所以不会包含到 render tree 中
  - 注意：visibility: hidden 隐藏的元素还是会包含到 render  tree 中，因为 visibility: hidden 会影响布局（layout），会占有空间
  - 根据 CSS2 的标准，render tree 中的每个节点都称为 Box，理解页面元素为一个具有填充、边距、边框和位置的盒子。
4. 一旦 render tree 构建完毕后，浏览器就可以根据 render tree 来绘制页面了

### JS中的性能优化
- 事件委托
- 防抖和截流
- 缓存代理