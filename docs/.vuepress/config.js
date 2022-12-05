const sidebar = require('./sidebar/index')

module.exports = {
  // base: './',
  title: 'Knowledge',
  description: '',
  dest: 'dist',
  themeConfig: {
    logo: '',

    nav: [
      { text: 'JavaScript', link: '/javascript/' },
      { text: 'HTML', link: '/html/' },
      { text: 'CSS', link: '/css/' },
      { text: 'Vue', link: '/vue/' },
      { text: '工程化', link: '/engineering/' },
      { text: '设计模式', link: '/design/' },
      { text: '笔记', link: '/note/' },
    ],

    sidebar,
  }
}
