module.exports = {
  '/engineering/': [
    {
      title: '自动化部署',
      sidebarDepth: 2,
      children: [
        { title: 'Github Actions', path: '/engineering/ci/github-action' },
        { title: 'Docker', path: '/engineering/ci/docker' },
        { title: 'Docker + DockerCompose + Jenkins + Nginx', path: '/engineering/ci/docker-DockerCompose-jenkins-nginx' }
      ]
    }
  ],
}