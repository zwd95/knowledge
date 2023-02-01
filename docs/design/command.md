# 命令模式
## 用途
命令模式是最简单和优雅的模式之一，命令模式中的命令（command）指的是一个执行某些特殊事情的指令

命令模式最常见的应用场景是：有时候需要向某些对象发送请求，但是并不知道请求的接收者是谁，也不知道被请求的操作是什么。此时希望用一种松耦合的方式来设计程序，使得请求发送者和请求接收者能够消除彼此之间的耦合关系

拿订餐来说，客人需要向厨师发送请求，但是完全不知道这些厨师的名字和联系方式，也不知道厨师炒菜的方式和步骤。命令模式把客人订餐的请求封装成 command 对象，也就是订餐中的订单对象。这个对象可以在程序中被四处传递，就像订单可以从服务员手中传到厨师的手中。这样一来，客人不需要知道厨师的名字，从而解开了请求调用者和请求接收者之间的耦合关系

另外，相对于过程化的请求调用，command 对象拥有更长的生命周期。对象的生命周期是跟初始请求无关的，因为这个请求已经被封装在了 command 对象的方法中，成为了这个对象的行为。我们可以在程序运行的任意时刻去调用这个方法，就像厨师可以在客户预定1个小时后才帮他炒菜，相当于程序在1个小时后才开始执行 command 对象的方法

## 例子
假设编写一个用户界面程序，该界面上至少有数十个 Button 按钮。因为项目复杂，所以决定让某个人负责绘制这些按钮，而另外一部分人负责编写点击按钮后的具体行为，这些行为都将被封装在对象里

```html
<body>
  <button id="button1">click 1</button>
  <button id="button2">click 2</button>
  <button id="button3">click 3</button>

  <script>
    var button1 = document.getElementById('button1')
    var button2 = document.getElementById('button2')
    var button3 = document.getElementById('button3')
  </script>
</body>
```

接下来定义 setCommand 函数，setCommand 函数负责往按钮上安装命令。可以肯定的是，点击按钮会执行某个 command 命令，执行命令的动作被约定为调用 command 对象的 execute() 方法。虽然还不知道这些命令究竟代表什么操作，但负责绘制按钮的程序员不关心这些事情，他只需要预留好安装命令的接口，command 对象自然知道如何和正确的对象沟通

```js
var setCommand = function (button, command) {
  button.onclick = function() {
    command.execute()
  }
};
```

最后，负责编写点击按钮之后的具体行为的程序员总算交上了他们的成果，他们完成了刷新菜单界面、增加子菜单和删除子菜单这几个功能，这几个功能被分布在 MenuBar 和 SubMenu 这两个对象中

```js
var MenuBar = {
  refresh: function() {
    console.log('刷新菜单');
  }
};

var SubMenu = {
  add() {
    console.log('增加子菜单');
  },
  del() {
    console.log('删除子菜单');
  }
};
```

在让 button 变得有用起来之前，要先把这些行为都封装在命令类中

```js
var RefreshMenuBarCommand = function(receiver) {
  this.receiver = receiver
};

RefreshMenuBarCommand.prototype.execute = function() {
  this.receiver.refresh()
}

var AddSubMenuCommand = function(receiver) {
  this.receiver = receiver
};

AddSubMenuCommand.prototype.execute = function() {
  this.receiver.add()
};

var DelSubMenuCommand = function(receiver) {
  this.receiver = receiver
};

DelSubMenuCommand.prototype.execute = function() {
  console.log('删除子菜单');
};
```

最后就是把命令接收者传入 command 对象中，并且把 command 对象安装到 button 上

```js
var refreshMenuBarCommand = new RefreshMenuBarCommand(MenuBar);
var addSubMenuCommand = new AddSubMenuCommand(SubMenu);
var delSubMenuCommand = new DelSubMenuCommand(SubMenu);

setCommand(button1, refreshMenuBarCommand);
setCommand(button2, addSubMenuCommand);
setCommand(button3, delSubMenuCommand);
```

## JavaScript 中的命令模式
也许会感到奇怪，所谓的命令模式，看起来就是给对象的某个方法取了 execute 的名字。引入 command 对象和 receiver 这两个无中生有的角色无非是把简单的事情复杂化，即使不用什么模式，用下面几行代码就可以实现相同的功能

```js
var bindClick = function(button, func) {
  button.onclick = func
};

var MenuBar = {
  refresh: function() {
    console.log('刷新菜单');
  }
};

var SubMenu = {
  add() {
    console.log('增加子菜单');
  },
  del() {
    console.log('删除子菜单');
  }
};

bindClick(button1, MenuBar.refresh)
bindClick(button2, SubMenu.add)
bindClick(button3, SubMenu.del)
```

这种说法是正确的，之前示例代码是模拟传统面向对象语言的命令模式实现。命令模式将过程式的请求调用封装在 command 对象的 execute 方法里，通过封装方法调用，我们可以把运算块包装成形。command 对象可以被四处传递，所以在调用命令时，客户不需要关心事情是如何进行的

命令模式的由来，其实是回调函数的一个面向对象的替代品

JavaScript 作为将函数作为一等对象的语言，跟策略模式一样，命令模式也早已融到了 JavaScript 语言之中。运算块不一定要封装在 command.execute 方法中，也可以封装在普通函数中。函数作为一等对象，本身就可以被四处传递。即使我们依然需要请求“接收者”，那也未必使用面向对象的方式，闭包可以完成同样的功能

在面向对象的设计中，命令模式的接收者被当成 command 对象的属性保存起来，同时约定执行命令的操作调用 command.execute 方法。在使用闭包的命令模式实现中，接收者被封闭在闭包产生的环境中，执行命令的操作可以更加简单，仅仅执行回调函数即可。无论接收者被保存为对象的属性，还是被封闭在闭包产生的环境中，在将来执行命令的时候，接收者都能被顺利访问。用闭包实现的命令模式如下代码所示

```js
var setCommand = function(button, func) {
  button.onclick = function() {
    func()
  }
}

var MenuBar = {
  refresh: function() {
    console.log('刷新菜单');
  }
};

var RefreshMenuBarCommand = function(receiver) {
  return function() {
    receiver.refresh()
  }
};

var refreshMenuBarCommand = RefreshMenuBarCommand(MenuBar)

setCommand(button1, refreshMenuBarCommand);
```

当然，如果想更明确地表示当前正在使用命令模式，或者除了执行命令之外，将来有可能还要提供撤销命令的操作。那最好还是把执行函数改为调用 execute 方法

```js
var RefreshMenuBarCommand = function(receiver) {
  return {
    execute() {
      receiver.refresh()
    }
  }
};

var setCommand = function(button, command) {
  button.onclick = function() {
    command.execute()
  }
};

var refreshMenuBarCommand = RefreshMenuBarCommand(MenuBar)

setCommand(button1, refreshMenuBarCommand);
```

## 撤销命令
命令模式的作用不仅是封装运算块，而且可以很方便地给命令对象增加撤销操作。就像订餐时客人可以通过电话来取消订单一样。

撤销操作的实现一般是给命令对象增加一个名为 unexecude 和 undo 的方法，在该方法里执行 execute 的反向操作。在 command.execute 方法执行之前，记录当前对象的状态，在 unexecude 或 undo 操作中，再让当前对象回到记录下的状态

```js
var RefreshMenuBarCommand = function(receiver) {
  receiver.oldState = null
  return {
    execute() {
      receiver.refresh()
      receiver.oldState = {}
    },
    undo() {
      receiver.refresh(receiver.oldState)
    }
  }
};

var setCommand = function(button, command) {
  button.onclick = function() {
    command.execute()
  }
};

var refreshMenuBarCommand = RefreshMenuBarCommand(MenuBar)

setCommand(button1, refreshMenuBarCommand);

cancelButton.onclick = function() {
  refreshMenuBarCommand.undo()
}
```

现在通过命令模式轻松地实现了撤销功能。如果用普通的方法调用实现，也许需要每次都记录对象的状态，才能让他回到之前的状态。

撤销是命令模式里一个非常有用的功能，试想一下开发一个围棋程序，把每一步棋子的变化都封装成命令，则可以轻而易举地实现悔棋功能。同样，撤销命令还可以用于实现编辑器的 Ctrl + Z 功能

## 宏命令
宏命令是一组命令的集合，通过执行宏命令的方式，可以一次执行一批命令。

```js
    var closeDoorCommand = {
      execute() {
        console.log('close door');
      }
    };

    var openComputerCommand = {
      execute() {
        console.log('open computer');
      }
    };

    var openWeChatCommand = {
      execute() {
        console.log('open wechat');
      }
    };

    // 定义宏命令 MacroCommand
    // add 方法表示把字命令添加进宏命令对象中
    // execute 方法，迭代子命令对象，依次执行子命令的 execute 方法
    var MacroCommand = function() {
      return {
        commandList: [],
        add(command) {
          this.commandList.push(command)
        },
        execute() {
          this.commandList.forEach(command => command.execute())
        }
      }
    };

    var macroCommand = MacroCommand();

    macroCommand.add(closeDoorCommand)
    macroCommand.add(openComputerCommand)
    macroCommand.add(openWeChatCommand)

    macroCommand.execute()
```

## 智能命令与傻瓜命令
上面创建的命令，closeDoorCommand 没有包含任何 receiver 的信息，他本身就包揽了执行请求的行为。这和之前看到的命令对象都包含 receiver 是矛盾的

一般来说，命令模式都会在 command 对象中保存一个接收者来负责真正执行客户的请求，这种情况下命令对象是 “傻瓜式的”，他只负责把客户的请求转交给接收者来执行，这种模式的好处是请求发起者和接收者之间尽可能地得到了解耦

但是我们也可以定义一些“更聪明”的命令对象，“聪明”的命令对象可以直接实现请求，这样一来就不再需要接收者的存在，这种“聪明”的命令对象也叫做智能命令。没有接收者的智能命令，退化到和策略模式非常相近，从代码结构上无法分辨他们，能分辨的只有他们意图的不同。策略模式指向的问题域更小，所有策略对象的目标总是一致的，他们只是达到这个目标的不同手段，他们的内部实现针对“算法”而言的。而智能命令模式指向的问题更广，command 对象解决的目标更具发散性。命令模式还可以完成撤销、排队等功能