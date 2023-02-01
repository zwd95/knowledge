// 两数之和

// 给定一个整数数组 nums 和一个整数目标值 target，请你在该数组中找出 和为目标值 target  的那 两个 整数，并返回它们的数组下标。

// 你可以假设每种输入只会对应一个答案。但是，数组中同一个元素在答案里不能重复出现。

// 你可以按任意顺序返回答案。

// 解法

// 用哈希表（字典）存放数组值以及对应的下标。

// 遍历数组，当发现 target - nums[i] 在哈希表中，说明找到了目标值。


function twoSum(nums, target) {
  const map = new Map()

  for (let i = 0; i < nums.length; i++) {
    const num = nums[i]
    const y = target - num

    if (map.has(y)) {
      return [map.get(y), i]
    }

    map.set(num, i)
  }

  return []
}

const nums = [1, 2, 3, 4, 5]

console.log(twoSum(nums, 6))