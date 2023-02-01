# 事件
## 事件流
事件流描述了页面接收事件的顺序。IE 和 Netscape 开发团队提供了几乎完全相反的事件流方案。IE 将支持事件冒泡流，而 Netscape 将支持事件捕获流

### 事件冒泡
IE 事件被称为事件冒泡，这是因为事件被定义为从最具体的元素（文档树中最深的节点）开始触发，然后向上传播至没有那么具体的元素（文档）

```html
<html>
  <head></head>
  <body>
    <div id="btn">click</div>
  </body>
</html>
```

在点击页面中的 div 元素后，click 事件会以如下顺序发生

- div
- body
- html
- document

也就是说 div 元素，即被点击的元素，最先触发 click 事件。然后，click 事件沿 DOM 树一路向上，在经过的每个节点依次触发，直至到达 document 对象

所有现代浏览器都支持事件冒泡，只是在实现方式上会有一些变化。IE5.5 及早期版本会跳过 html 元素，从 body 直接到 document。现代浏览器中的事件会一直冒泡到 window 对象

### 事件捕获
Netscape 团队提出了另一种名为事件捕获的事件流。事件捕获的意思是最不具体的节点应该最先收到事件，而最具体的节点应该最后收到事件。事件捕获实际上是为了在事件到达最终目标前拦截事件。如果前面的例子使用事件捕获，则点击 div 元素会以下列顺序触发 click 事件

- document
- html
- body
- div

在事件捕获中，click 事件首先由 document 元素捕获，然后沿 DOM 树依次向下传播，直至到达实际的目标元素 div。

虽然这是 Netscape 唯一的事件流模型，但事件捕获得到了所有现代浏览器的支持，实际上，所有浏览器都是从 window 对象开始捕获事件，而 DOM2 Events 规范规定的是从 document 开始。

由于旧版本浏览器不支持，因此实际当中几乎不用使用事件捕获。通常建议使用事件冒泡，特殊情况下可以使用事件捕获

### DOM 事件流
DOM2 Events 规范规定事件流分为 3个阶段：事件捕获、到达目标和事件冒泡。事件捕获最先发生，为提前拦截事件提供了可能。然后，实际的目标元素接收到事件。最后一个阶段是冒泡，最迟要在这个阶段响应事件。仍以前面那个简单的 HTML 为例，点击 div 元素会以下列顺序触发事件

- document
- html
- body
- div
- body
- html
- document

在 DOM 事件流中，实际的目标 div 元素 在捕获阶段不会接收事件。这是因为捕获阶段从 document 到 html 再到 body 就结束了。下一阶段，即会在 div 元素上触发事件的 “到达目标” 阶段，通常在事件处理时被认为是冒泡阶段的一部分。然后，冒泡阶段开始，事件反向传播至文档

大多数支持 DOM 事件流的浏览器实现了一个小小的拓展。虽然 DOM2 Events 规范明确捕获阶段不命中事件目标，但现代浏览器都会在捕获阶段在事件目标上触发事件。最终结果是在事件目标上有两个机会来处理事件

> 注意 所有现代浏览器都支持 DOM 事件流，只有 IE8 及更早版本不支持

## 内存与性能
因为事件处理程序在现代 Web 应用中可以实现交互，所以很多开发者会错误地在页面中大量使用他们。在创建 GUI 的语言如 C# 中，通常会给 GUI 上的每个按钮设置一个 onclick 事件处理程序。这样做不会有什么性能损耗。在 JavaScript 中，页面中事件处理程序的数量与页面整体性能直接相关。原因有很多。首先，每个函数都是对象，都占用内存空间，对象越多，性能越差。其次，为指定事件处理程序所需访问 DOM 的次数会先期造成整个页面交互的延迟。只要在使用事件处理程序多注意一些方法，就可以改善页面性能

### 事件委托
“过多事件处理程序” 的解决方案是使用事件委托。事件委托利用事件冒泡，可以只使用一个事件处理程序来管理一种类型的事件。例如，click 事件冒泡到 document。这意味着可以为整个页面指定一个 onclick 事件处理程序，而不用为每个可点击元素分别指定事件处理程序

```html
<ul id="list">
  <li id="a">a</li>
  <li id="b">b</li>
  <li id="c">c</li>
</ul>
```

这里的 HTML 包含 3个列表项，在被点击时应该执行某个操作。对此，通常的做法是像这样指定 3个处理程序

```js
let item1 = document.getElementById('a')
let item2 = document.getElementById('b')
let item3 = document.getElementById('c')

item1.addEventListener('click', (event) => {
  // ....
})

item2.addEventListener('click', (event) => {
  // ....
})

item3.addEventListener('click', (event) => {
  // ....
})
```

如果对页面中所有需要使用 onclick 事件处理程序的元素都如法炮制，结果就会出现大片雷同的只为指定事件处理程序的代码。使用事件委托，只要给所有元素共同的祖先节点添加一个事件处理程序，就可以解决问题

```js
const list = document.getElementById('list')

list.addEventListener(click, (event) => {
  const target = event.target

  switch(target.id) {
    case 'a':
      // ...
      break;
    case 'b':
      // ...
      break;
    case 'c':
      // ...
      break;
  }
})
```

这里只给 ul 元素添加一个 onclick 事件处理程序。因为所有列表项都是这个元素的后代，所以他们的事件会向上冒泡，最终都会由这个函数来处理。但事件目标是每个被点击的列表项，只要检查 event 对象的 id 属性就可以确定，然后再执行相应的操作即可。相对于前面不使用事件委托的代码，这里的代码不会导致先期延迟，因为只访问了一个 DOM元素和添加了一个事件处理程序。结果对用户来说没什么区别，但这种方式占用内存更少。所有使用按钮的事件（大多数鼠标事件和键盘事件）都适用于这个解决方案

只要可行，就应该考虑只给 document 添加一个事件处理程序，通过他处理页面中所有某种类型的事件。要相对之前的技术，事件委托有如下优点

- document 对象随时可用，任何时候都可以给他添件事件处理程序（不用等待 DOMContentLoaded 或 load 事件）。这意味着只要页面渲染出可点击元素，就可以无延迟地起作用
- 节省华仔设置页面事件处理程序上的事件。只指定一个事件处理程序可以节省 DOM 引用，也可以节省时间
- 减少整个页面所需的内存，提升整体性能

最适合使用事件委托的事件包括：click、mousedown、mouseup、keydown 和 keypress。mouseover 和 mouseout 事件冒泡，但很难适当处理，且经常需要计算元素位置（因为 mouseout 会在光标从一个元素移动到他的一个后代节点以及移出元素之外时触发）

### 删除事件处理程序
把事件处理程序指定给元素后，在柳岸来代码和负责页面交互的 JavaScript 代码之间就建立了联系。这种联系建立的越多，页面性能就越差。除了通过事件委托来限制这种连接之外，还应该及时删除不用的事件处理程序。很多 Web 应用性能不佳都是由于无用的事件处理程序常驻内存导致的

导致这个问题的原因主要有两个。第一个是删除带有事件处理程序的元素。比如通过真正的 DOM 方法 removeChild() 或 replaceChild() 删除节点。最常见的还是使用 innerHTML 整体替换页面的某一个部分。这时候，被 innerHTML 删除的元素上如果有事件处理程序，就不会被垃圾收集程序正常清理

```html
<div id="div">
  <input type="button" value="click" id="btn">
</div>
<script>
  let btn = document.getElementById('btn')
  btn.onclick = function() {
    // ...
    document.getElementById('div').innerHTML = 'Process...'
    // 不好
  }
</script>
```

这里的按钮在 div 元素中，单击按钮，会将自己删除并替换为一条消息，以阻止双击发生。这是很多网站上常见的做法。问题在于，按钮被删除之后仍关联着一个事件处理程序。在 div 元素上设置 innerHTML 会完全删除按钮，但事件处理程序仍然挂在按钮上面。某些浏览器，特别是 IE 及更早版本，在这时候就会有问题了。很多可能元素的引用和事件处理程序会残留在内存中。如果知道某个元素会被删除，那么最好在删除他之前手工删除他的事件处理程序

```js
let btn = document.getElementById('btn')
  btn.onclick = function() {
    // ...
    btn.onclick = null // 删除事件处理程序
    document.getElementById('div').innerHTML = 'Process...'
  }
```

在这个重写后的例子中，设置 div 元素的 innerHTML 属性之前，按钮的事件处理程序先被删除了。这样就可以确保内存回收，按钮也可以安全地从 DOM 中删除

但也要注意，在事件处理程序中删除按钮会阻止事件冒泡。只有事件目标仍然存在于文档时，事件才会冒泡

> 注意：事件委托也有助于解决这种个问题。如果提前知道页面某一部分会被使用 innerHTML 删除，就不要直接给该部分的元素添加事件处理程序了。把事件处理程序添加到更高层级的节点上同样可以处理该区域的事件

另一个可能导致内存残留引用的问题是页面卸载。同样 IE8 及更早版本在这种情况下有很多问题。不过好像所有浏览器都会受这个问题影响。如果在页面卸载后事件处理程序没有被清理，则他们仍然会残留在内存中。之后，浏览器每次加载和卸载页面（比如通过前进、后退或刷新），内存中残留对象的数量都会增加，这是因为事件处理程序不会被回收

一般来说，最好在 onunload 事件处理程序中趁页面尚未卸载先删除所有事件处理程序。这时候也能体现使用事件委托的优势，因为事件处理程序很少，所以很容易记住要删除哪些。关于卸载页面时的清理，可以记住一点：onload 事件处理程序做了什么，最好在 onunload 事件处理程序中恢复

> 注意：在页面中使用 onunload 事件处理程序意味着页面不会被保存在往返缓存中。如果这对应用很重要，可以考虑只在 IE 中使用 onunload 来删除事件处理程序