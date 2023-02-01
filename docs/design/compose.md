# 组合模式
组合模式就是用小的子对象来构建更大的对象，而这些小的子对象本身也许是由更小的 “孙对象” 构成的

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

上述代码，宏命令中包含了一组子命令，他组成了一个树形结构

其中 macroCommand 被称为组合对象，closeDoorCommand、openComputerCommand、openWeChatCommand 都是子对象。在 macroCommand 的 execute 方法里，并不执行真正的操作，而是遍历它所包含的子对象，把真正的 execute 请求委托给这些子对象

macroCommand 表现的像一个命令，但他实际上只是一组真正命令的 “代理”。并非真正的代理，虽然结构上相似，但 macroCommand i只负责传递请求给子对象，他的目的不在于控制对子对象的访问

## 组合模式的用途
组合模式将对象组合成树形结构，以表示 “部分-整体” 的层次结构。除了用来表示树形结构之外，组合模式的另一个好处是通过对象的多态性表现，使得用户对单个对象和组合对象的使用具有一致性

- 表示树形结构。回顾上述例子。很容易找到组合模式的一个优点：提供了一种遍历属性结构的方案，通过调用组合对象的 execute 方法，程序会递归调用组合对象下面的子对象 execute 方法，所以遥控器（组合对象）只需执行一次操作，便能依次完成关门、打开电脑等操作。组合模式可以非常方便地描述对象 部分-整体层次结构
- 利用对象多态性统一对待组合对象和单个对象。利用对象的多态性表现，可以使客户端忽略组合对象和单个对象的不同。在组合模式中，客户将统一地使用组合结构中的所有对象，而不需要关心他究竟是组合对象还是单个对象

这在实际开发中会给客户带来相当大的便利性。当我们往遥控器添加一个命令的时候，并不关心这个命令是宏命令还是普通子命令。这点不重要，只需要确定他是一个命令，并且这个命令拥有可执行的 execute 方法，那么这个命令就可以被添加进遥控器

## 请求在树中传递的过程
在组合模式中，请求在树中传递的过程总是遵循一种逻辑

以宏命令为例，请求从树最顶端的对象往下传递，如果当前处理请求的对象是子对象（普通子命令），子对象自身会对请求作出相应的处理；如果当前请求的对象是组合对象（宏命令），组合对象则会遍历它属下的子节点，将请求继续传递给这些子节点

总而言之，如果子节点是子对象，子对象自身会处理这个请求；如果子节点是组合对象，请求会继续往下传递。子对象下面不会再有其他子节点，一个子对象就是树的这条分支的尽头，组合对象下面可能还会有其他子节点

## 更强大的宏命令
目前的遥控器，包含了关门、开电脑、登陆微信这3个命令。选在需要一个遥控，可以控制家里所有电器，包括以下功能

- 打开空调
- 打开电视和音响
- 关门、开电脑、登陆微信

```html
<html lang="en">
<body>
  <button id="btn">遥控器</button>

  <script>
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

    var openAcCommand = {
      execute() {
        console.log('打开空调');
      }
    };

    // 电视和音响是连接在一起的，所以可以用一个宏命令来组合打开电视和音响
    var openTVCommand = {
      execute() {
        console.log('打开电视');
      }
    };

    var openSoundCommand = {
      execute() {
        console.log('打开音响');
      }
    };

    var macroCommand1 = MacroCommand();

    macroCommand1.add(openTVCommand)
    macroCommand1.add(openSoundCommand)

    // 关门、打开电脑和登陆微信的命令
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

    var macroCommand2 = MacroCommand();
    macroCommand2.add(closeDoorCommand)
    macroCommand2.add(openComputerCommand)
    macroCommand2.add(openWeChatCommand)

    // 现在把所有命令组合成一个 “超级命令”
    var macroCommand = MacroCommand();
    macroCommand.add(openAcCommand)
    macroCommand.add(macroCommand1)
    macroCommand.add(macroCommand2)

    // 最后给遥控器绑定命令
    var setCommand = (function(command) {
      document.getElementById('btn').onclick = function() {
        command.execute()
      }
    })(macroCommand);
  </script>
</body>
</html>
```

从这个例子可以看到，基本对象可以被组合成更复杂的组合对象，组合对象又可以被组合。这样不断递归下去，这棵树的结构可以支持任意多的复杂度。在树最终被构造完成之后，让树最终运转起来的步骤非常简单，只需要调用最上层对象的 execute 方法。

## 抽象类在组合模式中的作用

## 透明性带来的安全问题
组合模式的透明性使得发起请求的客户不用去顾及树中组合对象和子对象的区别，但他们在本质上是有区别的

组合对象可以拥有子节点，子对象下面就没有子节点，所以，我们也许会发生一些误操作，比如试图往子对象中添加子节点。解决方案通常是给子对象也增加 add 方法，并且在调用这个方法时，抛出一个异常来及时提醒客户

```js
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

    var openTvCommand = {
      execute() {
        console.log('open Tv');
      },
      add() {
        throw new Error('子对象不能添加子节点')
      }
    };

    var macroCommand = MacroCommand()

    macroCommand.add(openTvCommand)
    openTvCommand.add(macroCommand) // Uncaught Error: 子对象不能添加子节点
```

## 组合模式例子 - 扫描文件夹
```js
    // 文件夹 Folder
    // 文件 File
    var Folder = function(name) {
      this.name = name
      this.files = []
    };

    Folder.prototype.add = function(file) {
      this.files.push(file)
    }

    Folder.prototype.scan = function() {
      console.log('开始扫描文件夹' + this.name);
      this.files.forEach(file => file.scan())
    }

    var File = function(name) {
      this.name = name
    };

    File.prototype.add = function() {
      throw new Error('文件下面不能添加文件夹')
    }

    File.prototype.scan = function() {
      console.log('开始扫描文件' + this.name);
    }

    // 创建一些文件夹和文件对象，并且让他们组合成一棵树
    var folder = new Folder('学习资料')
    var folder1 = new Folder('JS')
    var folder2 = new Folder('CSS')

    var file1 = new File('JS BASE')
    var file2 = new File('CSS WORLD')
    var file3 = new File('DESIGN');

    folder1.add(file1)
    folder2.add(file2)

    folder.add(folder1)
    folder.add(folder2)
    folder.add(file3)
```

现在需求是将下面的文件和文件夹中都复制到这棵树上

```js
var folder3 = new Folder('Node')
var file4 = new File('Node book')

folder3.add(file4)

var file5 = new File('xxxxxx')
// 将这些文件添加到原有的树中
folder.add(folder3)
folder.add(file5)
```

通过这个例子，再次看到客户是如何同等对待组合对象和子对象。在添加一些文件的操作中，客户不用分辨他们到底是文件还是文件夹。新增加的文件和文件夹能够很容易到原来的树结构中，和树里已有的对象一起工作

我们改变了树的结构，增加了新的数据，却不用修改任何一句原有的代码，这是符合开放-封闭原则

## 一些值得注意的地方
### 组合模式不是父子关系
组合模式的树形结构容易让人误以为组合对象和子对象是父子关系，这是不正确的

组合模式是一种 HAS-A（聚合）的关系，而不是 IS-A。组合对象包含一组子对象，但 Leaf 并不是 Composite 的子类。组合对象把请求委托给他所包含的所有子对象（叶对象），他们能够合作的关键是拥有相同的接口

### 对叶对象操作的一致性
组合模式除了要求组合对象和叶对象拥有相同的接口之外，还有一个必要条件，就是对一组叶对象的操作必须具有一致性

比如公司要给全体员工发放过节费 1000，这个场景可以运用组合模式，但如果公司给今天过生日的员工发送一封生日祝福的邮件，组合模式在这里没有用武之地，除非先把今天过生日的员工挑选出来。只有用一致的方式对待列表中的每个叶对象的时候，才适合使用组合模式

### 双向映射关系
发放过节费的通知步骤是从公司到各个部门，再到各个小组，最后到每个员工的邮箱里。这本身是一个组合模式的好例子，但要考虑的一种情况是，也许某些员工属于多个组织架构。比如，某位人员隶属于开发组，也属于架构组，对象之间的关系并不是严格意义上的层次结构，在这种情况下，是不适合使用组合模式的

这种复合情况下我们必须给父节点和子节点建立双向映射关系，一个简单的方法是给小组和员工对象都增加集合来保存对方的引用。但是这种相互间的引用相当复杂，而且对象之间产生了过多的耦合性，修改或者删除一个对象都变得困难，此时可以引入中介者模式来管理这些对象

## 引用父对象