const sidebar = require('./modules/sidebar.js');

module.exports = {
  base: '/knowledge/',
  title: 'Knowledge',
  description: '',
  themeConfig: {
    logo: '',

    nav: [
      { text: 'JavaScript', link: '/javascript/' },
      { text: 'HTML', link: '/html/' },
      { text: 'CSS', link: '/css/' },
      { text: 'Vue', link: '/vue/' },
      { text: '工程化', link: '/engineering/' }
    ],

    sidebar: {
      '/engineering/': [
        '',
        'github-action',
      ],
    }
  }
}
