---
sidebarDepth: 3
---

# this 的指向
函数的 this 在调用时绑定的。完全取决于函数的调用位置（也就是函数的调用方法）。为了搞清楚 this 的指向是什么，必须知道相关函数是如何调用的。

## 全局上下文
非严格模式和严格模式中 this 都是指向顶层对象（浏览器中是 window）

```js
this === window // true
'use strict'
this === window
this.name = 'window name'
console.log(this.name) // window name
```

## 函数上下文
### 普通函数调用模式
```js
// 非严格模式
var name = 'window'
var foo = function() {
  console.log(this.name)
}

foo() // 'window'
```

可能会误以为是 window.foo() 调用的，所以 this 指向 window。虽然本例中 window.foo 确实是等于 foo。name 等于 window.name。上述代码是因为在 ES5 中，全局变量是挂载到顶层对象（浏览器是 window）。事实上，并不是如此

```js
// 非严格模式
let name = 'window'
let foo = function() {
  console.log(this === window)
  console.log(this.name)
}

foo() // true undefined
```

这个例子中，let 没有给顶层对象添加属性，window.name 和 window.foo 都是 undefined

严格模式中，普通函数的 this 则表现不同，表现为 undefined

```js
'use strict'
var name = 'window'
var foo = function() {
  console.log(typeof this === 'undefined')
  console.log(this.name)
}

foo() // true 报错，因为 this 是 undefined
```
《你不知道的 JavaScript》 上卷，将这种叫做默认绑定。对 call、apply 属性的回类比为

```js
foo.call(undefined)
foo.apply(undefined)
```

效果是一样的，call、apply 作用之一就是用来修改函数中的 this 指向为第一个参数的。第一个参数是 undefined 或者 null，非严格模式下，是指向 window。严格模式下，就是指向第一个参数

经常有这类代码（回调函数），其实也是普通函数调用模式

```js
var name = 'name';

setTimeout(function() {
  console.log(this.name) // 非严格模式下， 浏览器环境下 this 指向 window
}, 0)

// 语法
setTimeout(fn |code, 0, arg1, arg2, ...)
// 类比 setTimeout 函数内部调用 fn 或者执行代码 code
fn.call(undefined, arg1, arg2, ...)

```

### 对象中的函数（方法）调用模式
```js
var name = 'window'
var foo = function() {
  console.log(this.name)
}

var obj = {
  name: 'obj name',
  foo: foo,
  other: {
    name: 'other name',
    foo: foo
  }
}

obj.foo() // obj name
obj.other.foo() // other name
// 用 call 类比则为
obj.foo.call(obj)

// 用call 类比则为
obj.other.foo.call(obj.other)
```

但往往会有下面常见，把对象的函数赋值给另外一个变量。这样的话，调用该变量，其实就相当于调用普通函数，this 还是指向全局对象

```js
var newFoo = obj.foo

newFoo() // window

// 类比为
newFoo.call(undefined)
```

### 构造函数调用模式
```js
function Student(name) {
  this.name = name;
  console.log(this) // { name: 'name' }
}

var student = new Student('name')

```

使用 new 操作符会执行以下步骤
- 创建一个全新的对象
- 这个对象会被执行 `[[Prototype]]` 链接
- 生成的新对象绑定到函数调用的 this
- 通过 new 创建的每个对象最终被 `[[Prototype]]` 链接到这个函数的 prototype 上
- 如果函数的返回值是 Object 类型（Function、Array、Date。。。）则返回这些类型，否则返回新创建的对象


### 原型链中的调用模式
```js
function Student(name) {
  this.name = name
}

Student.prototype.say = function() {
  console.log(this.name)
}

const student = new Student('name')
student.say() // name
```

谁调用函数，this 就指向谁

上述代码使用ES6 中 class 的写法则是

```js
class Student {
  constructor(name) {
    this.name = name
  }

  say() {
    console.log(this.name)
  }
}

const student = new Student('name')
student.say() // name
```

### 箭头函数调用模式
箭头函数和普通函数的重要区别
- 箭头函数没有自己的 this、super、arguments 和 new.target 绑定
- 不能使用 new 来调用。
- 没有原型对象
- 不可改变 this 的绑定
- 形参名称不能重复

箭头函数中没有 this 绑定，必须通过查找作用域链来决定其值。如果箭头函数被非箭头函数包含，则 this 绑定的是最近一层非箭头函数的 this，否则 this 的值则被设置为全局对象。

```js
    var name = 'window';
    var student = {
      name: 'student name',
      foo: function () {
        var say = () => {
          console.log(this.name);
        }

        say();
      },

      say2: () => {
        console.log(this.name);
      }
    };

    student.foo() // student name

    student.say2() // window
```

其实就是相当于箭头函数外的 this 是缓存的该箭头函数上层的普通函数的 this。如果没有普通函数，则是全局对象。也就是无法通过 call、apply、bind 绑定箭头函数的 this（他本身就没有 this）。而 call、apply、bind 可以绑定缓存箭头函数上层的普通函数的 this

```js
    var student = {
      name: 'student name',
      say: function name() {
        console.log(this.name);

        return () => {
          console.log('say', this.name);
        }
      }
    };

    var person = {
      name: 'person name'
    };

    student.say().call(person) // student name  say student name
    student.say.call(person)() // person name say person name
```

总结：可以通过改变箭头函数上的普通函数的 this 指向，从而指定箭头函数内部的 this 指向

### DOM 事件处理函数调用
addEventListener、attachEvent、onclick

```html
  <button class="button">onclick</button>

  <ul class="list">
    <li>1</li>
    <li>2</li>
    <li>3</li>
  </ul>

  <script>
    var button = document.querySelector('.button');

    button.onclick = function (ev) {
      console.log(this);
      console.log(this === ev.currentTarget); // true
    }

    var list = document.querySelector('.list')

    list.addEventListener('click', function (ev) {
      console.log(this === list);
      console.log(this === ev.currentTarget)
      console.log(this);
      console.log(ev.target);
    }, false)
  </script>
```

onclick 和 addEventListener 是指向绑定事件的元素。一些浏览器，比如 IE6～IE8 下使用 attachEvent，this 指向 window。

ev.currentTarget 和 ev.target 的区别

ev.currentTarget 是绑定事件的元素，而 ev.target 是当前触发事件的元素。比如这里的分别是 ul 和 li。但也可能惦记的是 ul。这是 ev.currentTarget === ev.target

#### 内联事件处理函数调用
```html
<button class="btn1" onclick="console.log(this === document.querySelector('.btn1'))">点击</button>
<button onclick="console.log((function() {return this})())">再次点击</button>
```

### 优先级
而箭头函数的 this 是上层普通函数的 this 或者是全局对象，所以排除，不算优先级
 
```js
    var name = 'window';
    var person = {
      name: 'person'
    };
    var say = function () {
      console.log(this.name);

      return function () {
        console.log('return:', this.name);
      }
    };

    var student = {
      name: 'student',
      say: say
    };

    // 普通函数调用
    say(); // window
    // 对象上的函数调用
    student.say(); // student
    // call、apply 调用
    student.say.call(person) // person

    new student.say.call(person)
```

如果是 student.say.call(person) 先执行的情况下，那么 new 执行一个函数。是没有问题的。然而事实上，这行代码报错。运算符优先级是 new 比点号低。所以是执行 new (student.say.call(person)) 而 Function.prototype.call，虽然是一个函数（apply、bind也是函数），跟箭头函数一样，不能用 new 调用。所以报错了

```js
Uncaught TypeError: student.say.call is not a constructor
```

这是因为函数内部有两个不同的方法: `[[Call]]` 和 `[[Constructor]]` 。当使用普通函数调用时，`[[Call]]` 会被执行。当使用构造函数调用时，`[[Constructor]]`会被执行。call、apply 、bind 和箭头函数内部都没有 `[[Constructor]]` 方法

## 总结
如果要判断一个运行中函数的 this 绑定。就需要找到这个函数直接调用位置

- new 调用：绑定到新创建的对象。
- call 或者 apply 或者 bind 调用： 严格模式下，绑定到指定的第一个参数，非严格模式下，null 和 undefined，指向全局对象。其余值指向被 new Object() 包装的对象
- 对象上的函数调用：绑定到那个对象
- 普通函数调用：在严格模式下绑定到 undefined，否则绑定到全局对象
