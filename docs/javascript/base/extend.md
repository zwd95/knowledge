---
sidebarDepth: 1
---

# JS 的继承
继承是面向对象编程中讨论最多的话题。很多面向对象语言都支持两种继承：接口继承和实现继承。前者只继承方法签名，后者继承实际的方法。接口继承在 ECMAScript 中是不可能的，因为函数没有签名。实现继承是 ECMAScript 唯一支持的继承方式，而这主要是通过原型链实现的。

JS 继承有6种
- 原型链继承
- 盗用构造函数
- 组合继承
- 原型式继承
- 寄生式继承
- 寄生式组合继承

## 原型链继承
ECMA-262 把原型链定义为 ECMAScript 的主要继承方式。其基本思想通过原型链继承多个引用类型的属性和方法。

重温一下构造函数、原型和实例的关系：每个构造函数都有一个原型对象，原型有一个属性指回构造函数，而实例内部有一个内部指针指向原型。如果原型是另一个类型的实例呢。那就意味着这个原型本身有一个内部指针指向另一个原型，相应地另一个原型也有一个指针指向另外一个构造函数。这样就在实例和原型之间构造了一条原型链。这就是原型链的基本思想。

实现原型链涉及以下代码模式

```js
function SuperType() {
  this.property = true;
}

SuperType.prototype.getSuperValue = function() {
  return this.property;
}

function SubType() {
  this.subProperty = false;
}

// 继承 SuperType
SubType.prototype = new SuperType()
SubType.prototype.getSubValue = function() {
  return this.subProperty;
}

let instance = new SubType()
console.log(instance.getSuperValue()) // true
```
上述代码定义了两个类型： SuperType 和 SubType。这两个类型分别定义了一个属性和一个方法。这两个类型的主要区别是 SubType 通过创建 SuperType 的实例并将其赋值给自己的原型 SubType.prototype 实现了对 SuperType 的继承。这个赋值重写了 SubType 最初的原型，将其替换为 SuperType 的实例。意味着 SuperType 实例可以访问的所有属性和方法也会存在于 SubType.prototype。这样实现继承之后，代码紧接着又给 SubType.prototype 也就是这个 SuperType 的实例添加了一个新方法。最后又创建了 SubType 的实例并调用了他继承的 getSuperValue() 方法。

这个例子中实现继承的关键，是 SubType 没有使用默认原型，而是将其替换成了一个新的对象。这个新的对象恰好是 SuperType 的实例。这样一来，SubType 的实例不仅能从 SuperType 的实例中继承属性和方法，而且还与 SuperType 的原型挂上钩了。于是 instance（通过内部[[Prototype]]）指向 SubType.prototype。注意，getSuperValue() 方法还在 Super.prototype 对象上，而 property 属性则在 SubType.prototype 上。这是因为 getSuperValue() 是一个原型方法，而 property 是一个实例属性。SubType.prototype 现在是 SuperType 的一个实例，因此 property 才会存储在他上面。

注意，由于 SubType.prototype 的 constructor 属性被重写指向 SuperType，所以 instance.constructor 也指向 SuperType。

原型链扩展了前面描述的原型搜索机制。我们知道，在读取实例上的属性时，首先会在实例上搜索这个属性。如果没有找到，则会继承搜索实例的原型。在通过原型链实现继承之后，搜索就可以继承向上，搜索原型的原型。

对前面的例子而言，调用 instance.getSuperValue() 经过了 3步搜索：instance、SubType.prototype 和 Super.prototype，最后一步才会找到这个方法。对属性和方法的搜索会一直持续到原型链的末端


### 1.默认原型
实际上，原型链中还有一环。默认情况下，所有引用类型都继承自 Object，这也是通过原型链实现的。任何函数的默认原型都是一个 Object 的实例，这意味着这个实例有一个内部指针指向 Object.prototype。这也是为什么自定义类型能够包括 toString()、valueOf() 在内所有默认方法的原因。因此前面的例子还有额外一层关系。

SubType 继承 SuperType，而 SuperType 继承 Object。在调用 instance.toString() 时，实际上调用的是保存在 Object.prototype 上的方法

可以理解为 Number.prototype 是一个对象（这个对象由 Object 生成的），每一个对象上都有一个 __proto__ 属性；这属性指向的真实 Object 的原型

而 Object.prototype 是原型链的末端，所以 Object.prototype.__proto__ 指向的是 null

### 2.原型与继承关系
原型与实例的关系可以通过两种方式来确定。第一种方式是使用 instanceof 操作符。如果一个实例的原型链中出现过相应的构造函数，则 instanceof 返回 true。如下例所示

```js
console.log(instance instanceof Object) // true
console.log(instance instanceof SuperType) // true
console.log(instance instanceof SubType) // true
```

从技术上讲，instance 是 Object、SuperType 和 SubType 的实例，因为 instance 的原型链中包含这些构造函数的原型。结果就是 instanceof 对所有这些构造函数都返回 true。

确定这种关系的第二种方式是使用 isPrototypeOf() 方法。原型链中的每个原型都可以调用这个方法，如下例所示，只要原型链中包含这个原型，这个方法就返回 true。

```js
console.log(Object.prototype.isPrototypeOf(instance)) // true
console.log(SuperType.prototype.isPrototypeOf(instance)) // true
console.log(SubType.prototype.isPrototypeOf(instance)) // true
```

### 关于方法
子类有时候需要覆盖父类的方法，或者增加父类没有的方法。为此，这些方法必须在原型赋值之后再添加到原型上。看下面例子

```js
    function SuperType() {
      this.property = true;
    };

    SuperType.prototype.getSuperValue = function () {
      return this.property;
    };

    function SubType() {
      this.subProperty = false;
    };

    SubType.prototype = new SuperType();

    // 新方法
    SubType.prototype.getSubValue = function () {
      return this.subProperty;
    };

    // 覆盖已有方法
    SubType.prototype.getSuperValue = function () {
      return false;
    };
```

上面代码中，涉及两个方法 getSubValue 和 getSuperValue。第一个方法 getSubValue() 是 SubType 的新方法，而第二个方法 getSuperValue() 是原型链上已存在但在这里被覆盖的方法。后面再 SubType 实例上调用 getSuperValue() 时调用的就是这个覆盖方法。而 SuperType 的实例仍然会调用最初的方法。重点在于上述两个方法都是在把原型赋值为 SuperType 之后定义的。

另一个要理解的重点是，以对象字面量方式创建原型方法会破坏之前的原型链，因为这相当于重写了原型链，下面是一个例子

```js
    function SuperType() {
      this.property = true;
    };

    SuperType.prototype.getSuperValue = function () {
      return this.property;
    }

    function SubType() {
      this.subProperty = false;
    }

    // 继承 SuperType
    SubType.prototype = new SuperType();

    // 通过对象字面量添加新方法，这会导致上一行无效
    SubType.prototype = {
      getSubValue() {
        return this.subProperty;
      },

      someOtherMethod() {
        return false;
      }
    }

    let instance = new SubType();
    console.log(instance.getSuperValue()); // 报错
```

在这段代码中，子类的原型在被赋值为 SuperType 的实例，又被一个对象字面量覆盖了。覆盖后的原型是一个 Object 的实例，而不再是 SuperType 的实例。因此之前的原型链就断了。SubType 和 SuperType 之间再也没有任何关系了。

### 4.原型链的问题
原型链虽然是实现继承的强大工具，但他也有问题。主要问题出现在原型中包含引用值的时候。前面谈到原型的问题时也提到过，原型中包含的引用值再所有实例间共享，这也是为什么属性通常会在构造函数中定义而不会定义在原型上的原因。在使用原型实现继承时，原型实际上变成了另一个类型的实例。这意味着原型的实例属性摇身一变成为了原型属性。下面例子揭示了这个问题。

```js
    function SuperType() {
      this.colors = ['red', 'blue', 'green']
    }

    function SubType() {

    }

    // 继承 SuperType
    SubType.prototype = new SuperType()

    let instance1 = new SubType();
    instance1.colors.push('black')

    console.log(instance1.colors);

    let instance2 = new SubType()
    console.log(instance2.colors); // ['red', 'blue', 'green', 'black']
```

在这个例子中，SuperType 构造函数定义了一个 colors 属性，其中包含一个数组（引用值）。每个 SuperType 的实例都会有自己的 colors 属性，包含自己的数组。但是，当 SubType 通过原型继承 SuperType 后，SubType.prototype 变成了 SuperType 的一个实例，因而也获得了自己的 colors 属性。这类似于创建了 SubType.prototype.colors 属性。最终结果是，SubType 的所有实例都会共享这个 colors 属性。这一点通过 instance1.colors 上的修改也能反映到 instance2.colors 上就可以看出来。

原型链的第二个问题是，子类型在实例化时不能给父类型的构造函数传参。事实上，我们无法在不影响所有对象实例的情况下把参数传进父类的构造函数。再加上之前提到的原型中包含引用值的问题，就导致原型链基本不会被单独使用。

## 盗用构造函数
为了解决原型包含引用值导致的继承问题，一种叫做“盗用构造函数”（constructor stealing）的技术在开发社区流行起来（这种技术有时也称作“对象伪装”或“经典继承”）。

基本思路很简单：在子类构造函数中调用父类构造函数。因为毕竟函数就是在特定上下文中执行代码的简单对象，所以可以使用 apply() 和 call() 方法以新创建的对象为上下文执行构造函数。看下面例子

```js
    function SuperType() {
      this.colors = ['red', 'blue', 'green']
    }

    function SubType() {
      SuperType.call(this)
    }

    let instance1 = new SubType();

    instance1.colors.push('black');

    console.log(instance1.colors); // ['red', 'blue', 'green', 'black']

    let instance2 = new SubType()

    console.log(instance2.colors); // ['red', 'blue', 'green']
```

上述代码中，Super.call(this) 展示了盗用构造函数的调用。通过使用 call() 和 apply() 方法，SuperType 构造函数在为 SubType 的实例创建的新对象的上下文执行了。这相当于新的 SubType 对象上运行了 SuperType() 函数中的所有初始化代码。结果就是每个实例都会有自己的 colors 属性。

### 1.传递参数
相比于使用原型链，盗用构造函数的一个优点就是可以在子类构造函数中向父类构造函数传参。看下面例子

```js
    function SuperType(name) {
      this.name = name;
    }

    function SubType() {
      // 继承并传参
      SuperType.call(this, 'name')
      this.age = 29;
    }

    let instance = new SubType();

    console.log(instance.name); // name
    console.log(instance.age); // 29
```

在这个例子中，SuperType 构造函数接收一个参数 name，然后将它赋值给一个属性。在 SubType 构造函数中调用 SuperType 构造函数时传入这个参数，实际上会在 SubType 的实例上定义 name 属性。

为确保 SuperType 构造函数不会覆盖 SubType 定义的属性，可以调用父类构造函数之后再给子类实例添加额外的属性。

### 2.盗用构造函数的问题
盗用构造函数的主要缺点，也是使用构造函数模式自定义类型的问题：必须在构造函数中定义方法，因此函数不能重用。此外，子类也不能访问父类原型上定义的方法，因此所有类型只能使用构造函数模式。由于存在这些问题，盗用构造函数基本上也不能单独使用。

## 组合继承
组合继承（有时候也叫伪经典继承）综合了原型链和盗用构造函数，将两者的优点集中起来。

基本思路是使用原型链继承原型上的属性和方法，而通过盗用构造函数继承实例属性。这样既可以把方法定义在原型上以实现重用，又可以让每个实例都有自己的属性。看下面例子

```js
    function SuperType(name) {
      this.name = name;
      this.colors = ['red', 'green', 'blue'];
    }

    SuperType.prototype.sayName = function () {
      console.log(this.name);
    }

    function SubType(name, age) {
      // 继承属性
      SuperType.call(this, name);

      this.age = age;
    }

    // 继承方法
    SubType.prototype = new SuperType()

    SubType.prototype.sayAge = function () {
      console.log(this.age);
    }

    let instance1 = new SubType('name', 28);
    instance1.colors.push('black')

    console.log(instance1.colors); // ['red', 'green', 'blue', 'black']
    instance1.sayName() // name
    instance1.sayAge() // 28

    let instance2 = new SubType('name2', 29);
    console.log(instance2.colors); // ['red', 'green', 'blue']
    instance2.sayName() // name2
    instance2.sayAge() // 29
```

在这个例子中，SuperType 构造函数定义了两个属性，name 和 colors，而他的原型上也定义了一个方法叫 sayName()。SubType 构造函数调用了 SuperType 构造函数，传入了 name 参数，然后又定义了自己的属性 age。此外，SubType.prototype 也被赋值为 SuperType 的实例。原型赋值之后，又在这个原型上添加了新的方法 sayAge()。

这样，就可以创建两个 SubType 实例，让这两个实例都有自己的属性，包括 colors，同时还共享相同的方法。

组合继承弥补了原型链和盗用构造函数的不足，是 JavaScript 中使用最多的继承模式。而且组合继承也保留了 instanceof 操作符和 isPrototypeOf() 方法识别合成对象的能力

## 原型式继承
2006年，Douglas Crockford 写了一篇文章：《JavaScript中的原型式继承》。这篇文章介绍了一种不涉及严格意义上构造函数的继承方法。他的出发点是即使不自定义类型也可以通过原型实现对象之间的信息共享。文章最终给出了一个函数

```js
function object(o) {
  function F() {}
  F.prototype = o
  return new F()
}
```

这个 object() 函数会创建一个临时构造函数，将传入的对象赋值给这个构造函数的原型，然后返回这个临时类型的一个实例。本质上，object() 是对传入的对象执行了一次浅复制。看下面例子

```js
    function object(o) {
      function F() {}
      F.prototype = o
      return new F()
    }
    let person = {
      name: 'person',
      friends: ['zs', 'ls']
    };

    let anotherPerson = object(person);

    anotherPerson.name = 'another'
    anotherPerson.friends = [1, 2, 3]

    let yetAnotherPerson = object(person);

    yetAnotherPerson.name = 'yet'
    yetAnotherPerson.friends.push('mz')

    console.log(person.friends); // ['zs', 'ls', 'mz']

```

Crockford 推荐的原型式继承适用于这种情况：你有一个对象，想在他的基础上再创建一个新对象。你需要把这个对象先传给 object()，然后再对返回的对象进行适当修改。在这个例子中 person 对象定义了另一个对象也应该共享的信息，把他传给 object() 之后会返回一个新对象。这个新对象的原型是 person，意味着他的原型上既有原始值又有引用值属性。这也意味着 person.friends 不仅是 person 的属性，也会跟 anotherPerson 和 yetAnotherPerson 共享。这里实际上克隆了两个 person。

ECMAScript5 通过增加 Object.create() 方法将原型式继承的概念规范化。这个方法接收两个参数：作为新对象原型的对象，以及给新对象定义额外属性的对象（第二个可选）。在只有一个参数时，Object.create() 与这里的 object() 方法效果相同

```js
    let person = {
      name: 'person',
      friends: ['zs', 'ls']
    };

    let anotherPerson = Object.create(person);

    anotherPerson.name = 'another'
    anotherPerson.friends.push('an')

    let yetAnotherPerson = Object.create(person);

    yetAnotherPerson.name = 'yet'
    yetAnotherPerson.friends.push('yet')

    console.log(person.friends); // ['zs', 'ls', 'an', 'yet']
```

Object.create() 的第二个参数与 Object.defineProperties() 的第二个参数一样：每个新增属性都通过各自的描述符来描述。以这种方式添加的属性会覆盖原型对象上的同名属性。比如：

```js
    let person = {
      name: 'person',
      friends: ['zs', 'ls']
    };

    let anotherPerson = Object.create(person, {
      name: {
        value: 'an name'
      }
    });

    console.log(anotherPerson.name); // an name
```

原型式继承非常适合不需要单独创建构造函数，但仍然需要在对象间共享信息的场合。但要记住，属性中包含的引用值始终会在相关对象间共享，跟使用原型模式是一样的。

## 寄生式继承
与原型式继承比较接近的一种继承方式是寄生式继承（parasitic inheritance），也是 Crockford 首倡的一种模式。寄生式继承背后的思路类似于寄生构造函数和工厂模式：创建一个实现继承的函数，以某种方式增强对象，然后返回这个对象。基本寄生继承模式如下：

```js
    function object(o) {
      function F() {}
      F.prototype = o
      return new F()
    }

    function createAnother(original) {
      let clone = object(original) // 通过调用函数创建一个新对象
      // 以某种方式增强这个对象
      clone.sayHi = function () {
        console.log('hi');
      }
      // 返回这个对象
      return clone;
    }
```

在这段代码中，createAnother() 函数接收一个参数，就是新对象的基准对象。这个对象 original 会被传给 object() 函数，然后返回的新对象赋值给 clone。接着给 clone 对象添加一个新方法 sayHi()。最后返回这个对象。可以像下面那样使用 createAnother() 函数

```js
    let person = {
      name: 'person',
      friends: [1, 2, 3]
    };

    let anotherPerson = createAnother(person);

    anotherPerson.sayHi()
```

这个例子基于 person 对象返回了一个新对象。新返回的 anotherPerson 对象具有 person 的所有属性和方法，还有一个新方法叫 sayHi()

寄生式继承同样适合主要关注对象，而不在乎类型和构造函数的场景。object() 函数不是寄生式继承必须的，任何返回新对象的函数都可以在这里使用。

注意：通过寄生式继承给对象添加函数会导致函数难以重用，与构造函数模式类似

## 寄生组合继承
组合继承其实也存在效率问题。最主要的效率问题就是父类构造函数始终会被调用两次：一次是在创建子类原型时调用，另一次是在子类构造函数中调用。本质上，子类原型最终是要包含超类对象的所有实例属性，子类构造函数只要在执行时重写自己的原型就行了。再看下这个组合继承例子

```js
    function SuperType(name) {
      this.name = name;
      this.colors = ['red', 'green']
    }

    SuperType.prototype.sayName = function () {
      console.log(this.name);
    }

    function SubType(name, age) {
      SuperType.call(this, name) // 第二次调用 SuperType()
      this.age = age;
    }

    SubType.prototype = new SuperType() // 第一次调用 SuperType()
    SubType.prototype.constructor = SubType
    SubType.prototype.sayAge = function () {
      console.log(this.age);
    }
```

代码注释部分时调用 SuperType 构造函数的地方。在上面的代码执行后，SubType.prototype 上会有两个属性：name 和 colors。他们都是 SuperType 的实例属性，但现在成为了 SubType 的原型属性。在调用 SubType 构造函数时，也会调用 SuperType 构造函数，这一次会在新对象上创建实例属性 name 和 colors。这两个实例属性会遮蔽原型上同名的属性

调用两次的 SuperType 的结果，会导致有两组 name 和 colors 属性：一组在实例上，另一组在 SubType 的原型上。这是调用两次 SuperType 构造函数的结果。好在有办法解决这个问题。

寄生式组合继承通过调用构造函数继承属性，但使用混合式原型链继承方式。基本思路是不通过调用父类构造函数给子类原型复制，而是取得父类原型的一个副本。说到底就是使用寄生式继承来继承父类原型，然后将返回的新对象复制给子类原型。寄生组合继承的基本模式如下所示：

```js
function inheritPrototype(subType, superType) {
  // 创建对象
  let prototype = object(superType.prototype)
  // 增强对象
  prototype.constructor = subType;
  // 赋值对象
  subType.prototype = prototype;
}
```

这个 inheritPrototype() 函数实现了寄生式组合继承的核心逻辑。这个函数接收两个参数：子类构造函数和父类构造函数。这个函数内部，第一步是创建父类原型的一个副本。然后，给返回的 prototype 对象设置 constructor 属性，解决由于重写原型导致 constructor 丢失的问题。最后将新创建的对象赋值给子类型的原型。如下例所示，调用 inheritPrototype() 就可以实现前面例子中的子类型原型赋值

```js
    function object(o) {
      function F() {}
      F.prototype = o
      return new F()
    }

    function inheritPrototype(subType, superType) {
      // 创建对象
      let prototype = object(superType)
      // 增强对象
      prototype.constructor = subType
      // 赋值对象
      subType.prototype = prototype
    }

    function SuperType(name) {
      this.name = name;
      this.colors = ['red', 'green']
    }

    SuperType.prototype.sayName = function () {
      console.log(this.name);
    }

    function SubType(name, age) {
      SuperType.call(this, name)
      this.age = age;
    }

    inheritPrototype(SubType, SuperType)

    SubType.prototype.sayAge = function () {
      console.log(this.age);
    }
```

这里只调用了一次 SuperType 构造函数，避免了 SubType.prototype 上不必要也不用到的属性，因此可以说这个例子的效率更高。而且，原型链仍保持不变，因此 instanceof 操作符和 isPrototypeOf() 方法正常有效。寄生式组合继承可以算是引用类型继承的最佳模式。


## 类
前几节深入讲解了如何只使用 ECMAScript 5的特性来模拟类似于类（class-like）的行为。不难看出，各种策略都有自己的问题，也有相应的拖鞋。正因为如此，实现继承的代码也显得非常冗长和混乱。

为解决这些问题，ECMAScript6 新引入的 class 关键字具有正式定义累的能力。类 （class）是ECMAScript 中新的基础性语法糖结构，因此刚开始接触时可能会不太习惯。虽然ECMAScript6 类表面上看起来可以支持正式的面向对象编程，但实际上他背后使用的仍然是原型和构造函数的概念。

### 类定义
与函数类型相似，定义类页游两种主要方式：类声明和类表达式。这两种方式都是 class 关键字加大括号

```js
// 类声明
class Person {}

// 类表达式
const Animal = class {}
```

与函数表达式类似，类表达式在他们被求值前也不能引用。不过，与函数定义不同的是，虽然函数可以提升，但类定义不能：

```js
    console.log(FunctionExpression); // undefined
    var FunctionExpression = function() {};
    console.log(FunctionExpression) // function() {}

    console.log(FunctionDeclaration); // FunctionDeclaration() {}
    function FunctionDeclaration() {};
    console.log(FunctionDeclaration); // FunctionDeclaration() {}

    console.log(ClassExpression); // undefined
    var ClassExpression = class {};
    console.log(ClassExpression); // class {}

    console.log(ClassDeclaration); // ReferenceError: ClassDeclaration is not defined
    class ClassDeclaration {}
    console.log(classDeclaration); // class ClassDeclaration {}
```

另一个跟函数声明不同的地方是，函数受函数作用域闲置，而类受块作用域限制：

### 类的构成
类可以包含构造函数方法、实例方法、获取函数、设置函数和静态类方法，但这些都不是必须的。空的类定义照样有效。默认情况下，类定义中的代码都在严格模式下执行。

与构造函数一样，多数编程风格都建议类名的首字母大写，以区别于通过他创建的实例（比如，通过 class Foo {} 创建实例 foo）

```js
      class Foo {}

      // 有构造函数的类，有效
      class Bar {
        constructor() {}
      }

      // 有获取函数的类，有效
      class Baz {
        get myBaz() {}
      }

      // 有静态方法的类，有效
      class Qux {
        static myQux() {}
      }
```

类表达式的名称是可选的。在把类表达式赋值给变量后，可以通过 name 属性取得类表达式的名称字符串。但不能在类表达式作用域外访问这个标识符

```js
      let Person = class PersonName {
        identify() {
          console.log(Person.name, PeronName.name);
        }
      }

      let p = new Person();

      p.identify() // PersonName PersonName

      console.log(Person.name); // PersonName
      console.log(PersonName.name); // ReferenceError: PersonName is not defined
```

## 类构造函数
constructor 关键字用于在类定义块内部创建类的构造函数。方法名 constructor 会告诉解释器在使用 new 操作符创建类的新实例时，应该调用这个函数。构造函数定义不是必须的，不定义构造函数相当于将构造函数定义为空函数。

### 实例化
使用 new 操作符实例化 Person 的操作等于使用 new 调用其构造函数。唯一可感知的不同之处就是，JavaScript 解释器知道使用 new 和意味着应该使用 constructor 函数进行实例化

使用 new 调用类的构造函数会执行如下操作

- 在内存中创建一个新对象
- 这个新对象内部 `[[Prototype]]` 指针被赋值为构造函数的 prototype 属性
- 构造函数内部的 this 被赋值为这个对象（即 this 指向新对象）
- 执行构造函数内部的代码（给新对象添加属性）
- 如果构造函数返回非空对象，则返回该对象；否则返回刚创建的新对象

看下面例子

```js
      class Animal {}

      class Person {
        constructor() {
          console.log('person ctor');
        }
      }

      class Vegetable {
        constructor() {
          this.color = 'orange'
        }
      }

      let a = new Animal();
      let p = new Person() // person ctor
      let v = new Vegetable();

      console.log(v.color); // orange
```

类实例化时传入的参数会用做构造函数的参数。如果不需要参数，则类名后面的括号也是可选的

```js
      class Person {
        constructor(name) {
          console.log(arguments.length);
          this.name = name || null;
        }
      }

      let p1 = new Person // 0
      console.log(p1.name); // null

      let p2 = new Person() // 0
      console.log(p2.name); // null

      let p3 = new Person('name') // 1
      console.log(p3.name); // name
```

默认情况下，类构造函数会在执行之后返回 this 对象。构造函数返回的对象会被用作实例化的对象，如果没有什么引用新创建的 this 对象，那么这个对象会被销毁。不过，如果返回的不是 this 对象，而是其他对象，那么这个对象不会通过 instanceof 操作符检测出跟类有关联，因为这个对象的原型指针没有被修改

```js
      class Person {
        constructor(override) {
          this.foo = 'foo'
          if (override) {
            return {
              bar: 'bar'
            }
          }
        }
      }

      let p1 = new Person(),
        p2 = new Person(true);

      console.log(p1); // Person { foo: 'foo' }
      console.log(p1 instanceof Person); // true

      console.log(p2); // { bar: 'bar' }
      console.log(p2 instanceof Person); // false
```

类构造函数与构造函数的主要区别是，调用类构造函数必须使用 new 操作符。而普通构造函数如果不使用 new 调用，那么就会以全局的 this （通常是 window）作为内部对象。调用类构造函数时如果忘了使用 new 则会抛错

```js
      function Person() {};

      class Animal {};

      // 把window 作为 this 来构建实例
      let p = Person();

      let a = Animal(); // TypeError: class constructor Animal cannot be invoked without 'new'
```

类构造函数没有什么特殊之处，实例化之后，他会成为普通的实例方法（但作为类构造函数，仍然要使用 new 调用）。因此，实例化之后可以在实例上引用他

```js
      class Person {};

      // 使用类创建一个新实例
      let p1 = new Person();

      p1.constructor(); // TypeError: Class constructor Person cannot be invoked without 'new'

      // 使用对类构造函数的引用创建一个新实例
      let p2 = new p1.constructor();
```

### 把类当成特殊函数
ECMAScript 中没有正式的类这个类型。从各方面看，ECMAScript 类就是一种特殊函数。声明一个类之后，通过 typeof 操作符检测类标识符，表明他是一个函数

```js
class Person {}

console.log(Person) // class Person {}

console.log(typeof Person) // function
```

类标识符有 prototype 属性，而这个原型也有一个 constructor 属性指向类自身

```js
class Person {}

console.log(Person.prototype) // { constructor: f() }
console.log(Person === Person.prototype.constructor) // true
```

与普通构造函数一样，可以使用 instanceof 操作符来检查构造函数原型是否存在于实例的原型链中：

```js
        class Person {}

        let p = new Person();

        console.log(p instanceof Person);
```

由此可知，可以使用 instanceof 操作符检查一个对象与类构造函数，以确定这个对象是不是类的实例。只不过此时的类构造函数要使用类标识符，比如，在前面的例子中要检查 p 和 Person

如前所属，类本身具有与普通构造函数一样的行为。在类的上下文中，类本身使用 new 调用时就会被当成构造函数。重点在于，类中定义的 constructor 方法不会被当成构造函数，在对他使用 instanceof 操作符时会返回 false。但是，如果在创建实例时直接将类构造函数当成普通函数来使用，那么 instanceof 操作符的返回值会反转

```js
    class Person {}

    let p1 = new Person();

    console.log(p1.constructor === Person); // true
    console.log(p1 instanceof Person); // true
    console.log(p1 instanceof Person.constructor); // false

    let p2 = new Person.constructor()

    console.log(p2.constructor === Person); // false
    console.log(p2 instanceof Person); // false
    console.log(p2 instanceof Person.constructor); // true
```

类是 JavaScript 的一等公民，因此可以像其他对象或函数引用一样把类作为参数传递

```js
   // 类可以像函数一样在任何地方定义，比如在数组中
    let classList = [
      class {
        constructor(id) {
          this.id = id;
          console.log(`instance ${this.id}`);
        }
      }
    ];

    function createInstance(classDefinition, id) {
      return new classDefinition(id)
    }

    let foo = createInstance(classList[0], 3333); // instance 333
```

与立即调用函数表达式相似，类也可以立即实例化

```js
    // 因为是一个类表达式，所以类名是可选的
    let p = new class Foo {
      constructor(x) {
        console.log(x);
      }
    }('bar') // bar

    console.log(p); // Foo {}
```

## 实例、原型和类成员
类的语法可以非常方便地定义应该存在于实例上的成员、应该存在于原型上的成员，以及应该存在于类本身的成员。

### 1.实例成员
每次通过 new 调用类标识符时，都会执行类构造函数。在这个函数内部，可以为新创建的实例（this）添加“自有”属性。至于添加什么样的属性，则没有限制。另外，在构造函数执行完毕后，仍然可以给实例继续添加新成员。

每个实例都对应一个唯一的成员对象，这意味着所有成员都不会在原型上共享。

```js
    class Person {
      constructor() {
        // 这个例子先使用对象包装类型定义一个字符串
        // 位的是下面测试两个对象的相等性
        this.name = new String('name')

        this.sayName = () => console.log(this.name);

        this.nicknames = ['1', '2']
      }
    }

    let p1 = new Person();
    let p2 = new Person();

    p1.sayName() // name
    p2.sayName() // name

    console.log(p1.name === p2.name); // false
    console.log(p1.sayName === p2.sayName); // false
    console.log(p1.nicknames === p2.nicknames); // false

    p1.name = p1.nicknames[0]
    p2.name = p2.nicknames[1]

    p1.sayName() // 1
    p2.sayName() // 2
```

### 2.原型方法与访问器
为了在实例间共享方法，类定义语法把在类块中定义的方法作为原型方法

```js
    class Person {
      constructor() {
        // 添加到 this 的所有内容都会存在于不同的实例上
        this.locate = () => console.log('instance');
      }

      // 在类块中定义的所有内容都会定义在类的原型上
      locate() {
        console.log('prototype');
      }
    }

    let p = new Person();

    p.locate() // instance
    Person.prototype.locate() // prototype
```

可以把方法定义在类构造函数中或者类块中，但不能在类块中给原型添加原始值或对象作为成员数据

```js
    // Uncaught SyntaxError: Unexpected token
    class Person {
      name: 'name'
    }
```

类方法等同于对象属性，因此可以使用字符串、符号或计算的值作为键

```js
    const symbolKey = Symbol('symbolKey');

    class Person {
      stringKey() {
        console.log('invoked stringKey');
      }

      [symbolKey]() {
        console.log('invoked symbolKey');
      }
      ['computed' + 'Key']() {
        console.log('invoked computedKey');
      }
    }

    let p = new Person();

    p.stringKey() // invoked stringKey
    p[symbolKey] // invoked symbolKey
    p.computedKey // invoked computedKey
```

类定义也支持获取和设置访问器。语法与行为跟普通对象一样

```js
    class Person {
      set name(newName) {
        this.name = newName;
      }

      get name() {
        return this.name
      }
    }

    let p = new Person();

    p.name = '123'
    console.log(p.name);
```

### 3.静态类方法
可以在类上定义静态方法。这些方法通常用于执行不特定于实例的操作，也不要求存在类的实例。与原型成员类似，静态成员每个类上只能有一个。

静态类成员在类定义中使用 static 关键字作为前缀。在静态成员中，this 引用类本身。其他所有约定跟原型成员一样

```js
    class Person {
      constructor() {
        // 添加到 this 的所有内容都会存在于不同的实例上
        this.locate = () => console.log('instance', this);
      }

      // 定义在类的原型对象上
      locate() {
        console.log('prototype', this);
      }

      // 定义在类本身上
      static locate() {
        console.log('class', this);
      }
    }

    let p = new Person();

    p.locate() // instance Person {}
    Person.prototype.locate() // prototype, { constructor: ... }
    Person.locate() // class, class Person {}
```

静态方法非常适合作为实例工厂：

```js
    class Person {
      constructor(age) {
        this.age = age;
      }

      sayAge() {
        console.log(this.age);
      }

      static create() {
        // 使用随机年龄创建并返回一个 Person 实例
        return new Person(Math.floor(Math.random() * 100))
      }
    }

    console.log(Person.create()); // Person { age: ... }
```

### 4.非函数原型和类成员
虽然类定义并不现实支持在原型或类上添加成员数据，但在类定义外部，可以手动添加

```js
    class Person {
      sayName() {
        console.log(`${Person.greeting} ${this.name}`);
      }
    }

    // 在类上定义数据成员
    Person.greeting = 'my name is'

    // 在原型上定义数据成员
    Person.prototype.name = 'name'

    let p = new Person()

    p.sayName() // my name is name
```

注意：类定义中之所以没有显示支持添加数据成员，是因为在共享目标（原型和类）上添加可变（可修改）数据成员是一种反模式。一般来说，对象实例应该独自拥有通过 this 引用的数据

### 5.迭代器与生成器方法
类定义语法支持在原型和类本身上定义生成器方法

```js
    class Person {
      // 在原型上定义生成器方法
      *createNicknameIterator() {
        yield 1;
        yield 2;
        yield 3;
      }

      // 在类上定义生成器方法
      static *createJobIterator() {
        yield 1;
        yield 2;
        yield 3;
      }
    }

    let jobIter = Person.createJobIterator()
    console.log(jobIter.next().value); // 1
    console.log(jobIter.next().value); // 2
    console.log(jobIter.next().value); // 3

    let p = new Person();
    let nicknameIter = p.createNicknameIterator();
    console.log(nicknameIter.next().value); // 1
    console.log(nicknameIter.next().value); // 2
    console.log(nicknameIter.next().value); // 3
```

因为支持生成器方法，所以可以通过添加一个默认的迭代器，把类实例变成可迭代对象：

```js
    class Person {
      constructor() {
        this.nicknames = [1, 2, 3]
      }

      *[Symbol.iterator]() {
        yield *this.nicknames.entries()
      }
    }

    let p = new Person();
    for (let [idx, nickname] of p) {
      console.log(nickname);
    }
```

也可以只返回迭代器实例：

```js
    class Person {
      constructor() {
        this.nicknames = [1, 2, 3]
      }

      [Symbol.iterator]() {
        return this.nicknames.entries()
      }
    }

    let p = new Person();

    for (let [idx, nickname] of p) {
      console.log(nickname);
    }
```

## 继承
本章前面花了大量篇幅如何使用 ES5 的机制实现继承。ECMAScript6 新增特性中最出色的一个就是原声支持类继承机制。虽然🥱继承使用的是新语法，但背后依旧使用的是原型链

### 1.继承基础
ES6 类支持但继承。使用 extends 关键字，就可以继承任何拥有 `[[Constructor]]` 和原型的对象。很大程度上，这意味着不仅可以继承一个类，也可以继承普通的构造函数（保持向后兼容）

```js
    class Vehicle {}

    // 继承类
    class Bus extends Vehicle {}

    let b = new Bus();

    console.log(b instanceof Bus); // true
    console.log(b instanceof Vehicle); // true

    function Person() {};

    // 继承普通构造函数
    class Engineer extends Person {}

    let e = new Engineer();

    console.log(e instanceof Engineer); // true
    console.log(e instanceof Person); // true
```

派生类都会通过原型链访问到类和原型上定义的方法。this 的值会反映调用相应的方法的实例或者类：

```js
    class Vehicle {
      identifyPrototype(id) {
        console.log(id, this);
      }

      static identifyClass(id) {
        console.log(id, this);
      }
    }

    class Bus extends Vehicle {}

    let v = new Vehicle();
    let b = new Bus();

    b.identifyPrototype('bus') // bus, Bus {}
    v.identifyPrototype('vehicle') // vehicle, Vehicle {}

    Bus.identifyClass('bus') // bus, class Bus {}
    Vehicle.identifyClass('vehicle') // vehicle, class Vehicle {}
```

注意：extends 关键字也可以在类表达式中使用，因此 let Bar = class extends Foo {} 是有效的语法

### 2.构造函数、HomeObject 和 super()
派生类的方法可以通过 super 关键字引用他们的原型。这个关键字只能在派生类中使用，而且仅限于类构造函数、实例方法和静态方法内部。在类构造函数中使用 super 可以调用父类构造函数。

```js
    class Vehicle {
      constructor() {
        this.hasEngine = true;
      }
    }

    class Bus extends Vehicle {
      constructor() {
        // 不要在调用 super() 之前引用this，否则会抛出 ReferenceError

        super() // 相当于 super.constructor()

        console.log(this instanceof Vehicle); // true
        console.log(this); // Bus { hasEngine: true }
      }
    }

    new Bus()
```

在静态方法中可以通过 super 调用继承的类上定义的静态方法

```js
    class Vehicle {
      static identify() {
        console.log('vehicle');
      }
    }

    class Bus extends Vehicle {
      static identify() {
        super.identify()
      }
    }

    Bus.identify() // vehicle
```

注意：ES6 给类构造函数和静态方法添加了内部特性 `[[HomeObject]]`，这个特性是一个指针，指向定义该方法的对象。这个指针是自动赋值的，而且只能在 JavaScript 引擎内部访问。super 始终会定义为 `[[HomeObject]]` 的原型

在使用 super 时要注意几个问题

- super 只能在派生类构造函数和静态方法中使用

```js
class Vehicle {
  constructor() {
    super()
    // SyntaxError: 'super' keyword unexpected
  }
}
```

- 不能单独引用 super 关键字，要么用它调用构造函数，要么用它引用静态方法

```js
class Vehicle {}

class Bus extends Vehicle {
  constructor() {
    console.log(super)

    // SyntaxError: 'super' keyword unexpected here
  }
}
```

- 调用 super() 会调用父类构造函数，并将返回的实例赋值给 this

```js
class Vehicle {}

class Bus extends Vehicle {
  constructor() {
    super()

    console.log(this instanceof Vehicle)
  }
}

new Bus() // true
```

- super() 的行为如同调用构造函数，如果需要给父类构造函数传参，则需要手动传入

```js
class Vehicle {
  constructor(licensePlate) {
    this.licensePlate = licensePlate
  }
}

class Bus extends Vehicle {
  constructor(licensePlate) {
    super(licensePlate)
  }
}

console.log(new Bus('123')) // Bus { licensePlate: '123' }
```

- 如果没有定义类构造函数，在实例化派生类时会调用 super()，而且会传入所有传给派生类的参数
```js
class Vehicle {
  constructor(licensePlate) {
    this.licensePlate = licensePlate
  }
}

class Bus extends Vehicle {}

console.log(new Bus('123')) // Bus { licensePlate: '123' }
```

- 在类构造函数中，不能在调用 super() 之前引用 this

```js
class Vehicle {}

class Bus extends Vehicle {
  constructor() {
    console.log(this)
  }
}

new Bus()

// ReferenceError: Must call super constructor in derived class before accessing 'this' or returning from derived constructor
```

- 如果派生类中定义了构造函数，则要么必须在其中调用 super()，要么必须在其中返回一个对象

```js
class Vehicle {}

class Card extends Vehicle {}

class Bus extends Vehicle {
  constructor() {
    super()
  }
}

class Van extends Vehicle {
  constructor() {
    return {}
  }
}

console.log(new Car()) // Car {}
console.log(new Bus()) // Bus {}
console.log(new Van()) // {}
```
### 3.抽象基类
有时候可能需要定义这样一个类，他可提供其他类继承，但本身不会被实例化。虽然 ECMAScript 没有专门支持这种类的语法，但通过 new.target 也很容易实现。new.target 保存通过 new 关键字调用的类或函数。通过在实例化时检测 new.target 是不是抽象基类，可以阻止对抽象基类的实例化

```js
    // 抽象基类
    class Vehicle {
      constructor() {
        console.log(new.target)

        if (new.target === Vehicle) {
          throw new Error('Vehicle cannot be directly instantiated')
        }
      }
    }

    // 派生类
    class Bus extends Vehicle {}

    new Bus() // class Bus {}
    new Vehicle()  // class Vehicle {}
    // Error: Vehicle cannot be directly instantiated
```

另外，通过在抽象基类构造函数中检查，可以要求派生类必须定义某个方法。因为原型方法在调用类构造函数之前已经存在了，所以可以通过 this 关键字来检查相应的方法。

```js
    // 抽象基类
    class Vehicle {
      constructor() {
        if (new.target === Vehicle) {
          throw new Error('Vehicle cannot be directly instantiated')
        }

        if (!this.foo) {
          throw new Error('Inheriting class must define foo()')
        }

        console.log('success');
      }
    }

    // 派生类
    class Bus extends Vehicle {
      foo() {}
    }

    // 派生类
    class Van extends Vehicle {}

    new Bus() // success
    new Van() // Error: Inheriting class must define foo()
```

### 4.继承内置类型
ES6 类为继承内置引用类型提供了顺畅的机制，开发者可以方便地扩展内置类型：

```js
    class SuperArray extends Array {
      shuffle() {
        // 洗牌算法
        for (let i = this.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));

          [this[i], this[j]] = [this[j], this[i]];
        }
      }
    }

    let a = new SuperArray(1, 2, 3, 4, 5);

    console.log(a instanceof Array); // true
    console.log(a instanceof SuperArray); // true
    console.log(a); // [1, 2, 3, 4, 5]
    a.shuffle()
    console.log(a); // [3, 1, 4, 5, 2]
```

有些内置类型的方法会返回新实例。默认情况下，返回实例的类型与原始实例的类型是一致的

```js
    class SuperArray extends Array {}

    let a1 = new SuperArray(1, 2, 3, 4, 5)
    let a2 = a1.filter(x => !!(x%2))

    console.log(a1); // [1, 2, 3, 4, 5]
    console.log(a2); // [1, 3, 5]
    console.log(a1 instanceof SuperArray); // true
    console.log(a2 instanceof SuperArray); // true
```

如果想要覆盖这个默认行为，则可以覆盖 Symbol.species 访问器，这个访问器决定在创建返回的实例时使用的类

```js
    class SuperArray extends Array {
      static get [Symbol.species]() {
        return Array
      }
    }

    let a1 = new SuperArray(1, 2, 3, 4, 5)
    let a2 = a1.filter(x => !!(x%2))

    console.log(a1);
    console.log(a2);
    console.log(a1 instanceof SuperArray); // true
    console.log(a2 instanceof SuperArray); // false
```

### 5.类混入
把不同类的行为集中到一个类是一种常见的 JavaScript 模式。虽然 ES6 没有显示支持多类继承，但通过现有特性可以轻松地模拟这种行为

注意：Object.assign() 方法是为了混入对象行为而设计的。只有在需要混入类的行为时才有必要自己实现混入表达式。如果只是需要混入多个对象的属性，那么使用 Object.assign() 就可以了。

下面代码片段中，extends 关键字后面是一个 JavaScript 表达式。任何可以解析为一个类或一个构造函数的表达式都是有效的。这个表达式会在求值类定义时被求值：

```js
class Vehicle {}

function getParentClass() {
  console.log('evaluated expression')
  return Vehicle;
}

class Bus extends getParentClass() {}
// 可求值表达式
```

混入模式可以通过在一个表达式中连缀多个混入元素来实现，这个表达式最终会解析为一个可以被继承的类。如果 Person 类需要组合 A、B、C，则需要某种机制实现 B 继承 A，C 继承 B，而 Person 再继承 C，从而把 A、B、C 组合到这个超类中。实现这种模式有不同的策略。

一个策略是定义一组“可嵌套”函数，每个函数分别接收一个超类作为参数，而将混入类定义为这个参数的子类，并返回这个类。这些组合函数可以连缀调用，最终组合成超类表达式。

```js
    class Vehicle {}

    let FooMixin = (SuperClass) => class extends SuperClass {
      foo() {
        console.log('foo');
      }
    }

    let BarMixin = (SuperClass) => class extends SuperClass {
      bar() {
        console.log('bar');
      }
    }

    let BazMixin = (SuperClass) => class extends SuperClass {
      baz() {
        console.log('baz');
      }
    }

    class Bus extends FooMixin(BarMixin(BazMixin(Vehicle))) {}

    let b = new Bus();

    b.foo()
    b.bar()
    b.baz()
```

通过写一个辅助函数，可以把嵌套调用展开

```js
    class Vehicle {}

    let FooMixin = (SuperClass) => class extends SuperClass {
      foo() {
        console.log('foo');
      }
    }

    let BarMixin = (SuperClass) => class extends SuperClass {
      bar() {
        console.log('bar');
      }
    }

    let BazMixin = (SuperClass) => class extends SuperClass {
      baz() {
        console.log('baz');
      }
    }

    // class Bus extends FooMixin(BarMixin(BazMixin(Vehicle))) {}

    function mix(BaseClass, ...Mixins) {
      return Mixins.reduce((accumulator, current) => current(accumulator), BaseClass)
    }

    class Bus extends mix(Vehicle, FooMixin, BarMixin, BazMixin) {}

    let b = new Bus();

    b.foo()
    b.bar()
    b.baz()
```

注意：很多 JavaScript 框架（特别是 React）已经抛弃混入模式，转向了组合模式（把方法提取到独立的类和辅助对象中，然后把他们组合起来，但不使用继承）。这反映了那个众所周知的软件设计原则：“组合胜过继承（composition over inheritance）”。这个设计原则被很多人遵循，在代码设计中能提供极大的灵活性。

## 小结
对象在代码执行过程中的任何时候都可以被创建和增强，具有极大的动态性，并不是严格定义的实体。下面的模式适用于创建对象

- 工厂模式就是一个简单的函数，这个函数可以创建对象，为他添加属性和方法，然后返回这个对象。这个模式在构造函数模式出现后就很少用了。
- 使用构造函数可以自定义引用类型，可以使用 new 关键字像创建内置类型实例一样创建自定义类型的实例。不过构造函数也有不足，主要是其成员无法重用，包括函数。考虑到函数本身是松散的、弱类型的，没有理由让函数不能在多个对象实例间共享。
- 原型模式解决了成员共享的问题，只要添加到构造函数 prototype 上的属性和方法就可以共享。而组合构造函数和原型模式通过构造函数定义实例属性，通过原型定义共享的属性和方法。

JavaScript 的继承主要通过原型链来实现。原型链涉及把构造函数的原型赋值为另一个类型的实例。这样一来，子类就可以访问弗雷德所有属性和方法，就像基于类的继承那样。原型链的问题是所有继承的属性和方法都会在对象实例间共享，无法做到实例私有。盗用构造函数模式通过在子类构造函数中调用父类构造函数，可以避免这个问题。这样可以让每个实例继承的属性都是私有的，但要求类型只能通过构造函数模式来定义（因为子类不能访问父类原型上的方法）。目前最流行的继承模式是组合继承，即通过原型链继承共享的属性和方法，通过盗用构造函数继承实例属性。

除了上述模式之外，还有以下几种继承模式

- 原型式继承可以无须明确定义构造函数而实现继承，本质上是对给定对象进行浅复制。这种操作的结果之后还可以再进一步增强。
- 与原型是继承紧密相关的是寄生式继承，即现给予一个对象创建一个新对象，然后再赠强这个新对象，最后返回新对象。这个模式也被用在组合继承中，用于避免重复调用父类构造函数导致的浪费。
- 寄生组合继承被认为是实现基于类型继承的最有效方式

ECMAScript6 新增的类很大程度上是基于既有原型机制的语法糖。类的语法让开发者可以优雅地定义向后兼容的类，既可以继承内置类型，也可以继承自定义类型。类有效地跨越了对象实例、对象原型和对象类之间的鸿沟。
