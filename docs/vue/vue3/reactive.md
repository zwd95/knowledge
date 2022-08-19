---
sidebarDepth: 2
---
# 响应式原理

相比于 Vue2，Vue3 采用 Proxy 去代理对象

- Proxy 对象实现属性监听
- 多层属性嵌套，在访问属性过程中处理下一级属性
- 默认监听动态添加的属性
- 默认监听数组索引和 length 长度
- 可以作为单独的模块使用

## reactive 模拟实现

reactive 接受一个参数，并返回一个 Proxy 对象

```js
const isObject = value => value !== null && typeof value === 'object'

const convert = target => isObject(target) ? reactive(target) : target

const hasOwnProperty = Object.prototype.hasOwnProperty
const hasOwn = (target, key) => hasOwnProperty.call(target, key)

// 拦截 proxy handler
const handler = {
  get(target, key, receiver) {
    // receiver 指定 Reflect.get 函数执行时，this 的指向
    const result = Reflect.get(target, key, receiver)

    // 对获取的数据作响应式处理
    return convert(result)
  },

  set(target, key, value, receiver) {
    const oldValue = Reflect.get(target, key)
    let result = true

    if (oldValue !== value) {
      result = Reflect.set(target, key, value, receiver)

      // 触发更新
    }

    return result
  },

  deleteProperty(target, key) {
    const hasKey = hasOwn(target, key)
    // 删除成功返回 true。
    const result = Reflect.deleteProperty(target, key)

    if (hasKey && result) {
      // 触发更新
    }

    return result
  }
}

function reactive(target) {
  // 只对对象作响应式处理
  if (!isObject(target)) {
    return
  }

  // 返回 Proxy 对象
  return new Proxy(target, handler)
}
```

## effect

在 Vue2 中，是通过 Dep 和 Watcher 去实现依赖收集和派发更新

其中 Watcher，接收一个参数 getter，getter 函数用于获取响应式属性最新的值。在 Vue3 里面用 effect 函数代替

而依赖收集则通过 track 函数，派发更新通过 trigger 函数

简单说下依赖的关系，Vue 会创建一个 WeakMap 对象 targetMap 用来存放每个响应式对象的和 depsMap 的关系，key 为 target，value 为 depsMap

depsMap 由 Map 对象创建，key 为 target 的属性，而 value 则为 dep

dep 由 Set 对象创建，他存放依赖这个属性的所有函数，当属性的值变更的时候，就触发这些函数

```js
// 记录当前活动的 effect ，相当于 Vue2 中 Dep.target
let activeEffect = null

function effect(callback) {
  activeEffect = callback
  // 执行回调函数，如果函数内部有访问响应式数据，则会进行依赖收集
  callback()
  // 依赖收集完之后，清空 activeEffect
  activeEffect = null
}

let targetMap = new WeakMap()

function track(target, key) {
  let depsMap = targetMap.get(target)

  // depsMap 不存在，初始化 target 对应的 depsMap
  if (!depsMap) {
    depsMap = targetMap.set(target, (depsMap = new Map()))
  }

  let dep = depsMap.get(key)
  // dep 不存在，初始化 key 对应的 dep
  if (!dep) {
    dep = depsMap.set(key, (dep = new Set()))
  }

  // 收集依赖函数
  dep.add(activeEffect)
}

function trigger(target, key) {
  const depsMap = targetMap.get(target)

  if (depsMap) {
    return
  }

  const dep = depsMap.get(key)

  if (!dep) {
    return
  }

  // 触发所有依赖函数
  dep.forEach(effect => effect())
}
```

最后，在访问属性的时候，添加 track 函数，设置属性值的时候，添加 trigger 函数

```js
const handler = {
  get(target, key, receiver) {
    // 依赖收集
    track(target, key)
    // receiver 指定 Reflect.get 函数执行时，this 的指向
    const result = Reflect.get(target, key, receiver)

    // 对获取的数据作响应式处理
    return convert(result)
  },

  set(target, key, value, receiver) {
    const oldValue = Reflect.get(target, key)
    let result = true

    if (oldValue !== value) {
      result = Reflect.set(target, key, value, receiver)

      // 触发更新
      trigger(target, key)
    }

    return result
  },

  deleteProperty(target, key) {
    const hasKey = hasOwn(target, key)
    // 删除成功返回 true。
    const result = Reflect.deleteProperty(target, key)

    if (hasKey && result) {
      // 触发更新
      track(target, key)
    }

    return result
  }
}
```