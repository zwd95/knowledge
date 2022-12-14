const css = require('./modules/css')
const javascript = require('./modules/javascript')
const html = require('./modules/html')
const engineering = require('./modules/engineering')
const vue = require('./modules/vue')
const note = require('./modules/note')
const design = require('./modules/design')

module.exports = {
  ...css,
  ...javascript,
  ...html,
  ...engineering,
  ...vue,
  ...note,
  ...design
}
