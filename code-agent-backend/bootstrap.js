console.log('MIDWAY_HTTP_PORT====>', process.env.YMM_GLOBAL_PORT, '\n')

const { Bootstrap } = require('@midwayjs/bootstrap')

const processTrace = require('./trace/index')

// 链路追踪
if (process.env.HOSTNAME?.startsWith('fta-server')) {
  processTrace()
}

Bootstrap.run()
