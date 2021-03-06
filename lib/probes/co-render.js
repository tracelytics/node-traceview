'use strict'

const rum = require('../rum')
const tv = require('..')
const Layer = tv.Layer
const conf = tv['co-render']

module.exports = function (render) {
  return function (view, opts) {
    const ret = render(view, opts)

    return function* () {
      // Check if there is a trace to continue
      const last = Layer.last
      if (!last || !conf.enabled) {
        return yield ret
      }

      let layer
      try {
        // Add rum data, when enabled
        if (tv.rumId) {
          const topLayer = tv.requestStore.get('topLayer')
          rum.inject(opts || {}, tv.rumId, topLayer.events.exit)
        }

        // Create co-render layer
        layer = last.descend('co-render', {
          TemplateFile: view,
          TemplateLanguage: opts.engine,

          // TODO: Disable for now. Maybe include behind config flag later.
          // Locals: JSON.stringify(options || {})
        })
      } catch (e) {}

      // Enter, run and exit
      if (layer) layer.enter()
      const res = yield ret
      if (layer) layer.exit()
      return res
    }
  }
}
