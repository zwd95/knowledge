module.exports = {
  '/engineering/': [
    {
      title: '自动化部署',
      sidebarDepth: 2,
      children: [
        { title: 'Github Actions', path: '/engineering/ci/github-action' },
        { title: 'Docker + Jenkins + Nginx', path: '/engineering/ci/docker-jenkins-nginx' }
      ]
    }
  ],
}