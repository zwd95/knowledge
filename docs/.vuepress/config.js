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

    sidebar: [
      {
        title: 'Group 1',
        path: '/engineering/',
        children: []
      },

      {
        title: '自动化部署',
        path: '',
        children: [
          { title: 'Github Page', path: '/engineering/ci/github-page.md' }
        ]
      }
    ]
  }
}
