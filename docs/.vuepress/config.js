const sidebar = require('./sidebar/index')

module.exports = {
  // base: './',
  title: 'Knowledge',
  description: '',
  themeConfig: {
    logo: '',

    nav: [
      { text: 'JavaScript', link: '/javascript/' },
      { text: 'HTML', link: '/html/' },
      { text: 'CSS', link: '/css/' },
      { text: 'Vue', link: '/vue/' },
      { text: '工程化', link: '/engineering/' },
      { text: '笔记', link: '/note/' }
    ],

    sidebar
  }
}
