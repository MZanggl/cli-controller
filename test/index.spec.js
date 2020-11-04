const util = require('util')
const childprocess = require('child_process')
const exec = util.promisify(childprocess.exec)
const test = require('japa')

test('will call default route if no argument is provided', async assert => {
  const { stdout } = await exec('node ./test/cli.js -h')
  assert.equal(stdout.trim(), 'default {"args":[],"flags":{"h":true},"params":{}}')
})

test('will call fallback if route was not found', async assert => {
  const { stdout } = await exec('node ./test/cli.js does-not-exist')
  assert.equal(stdout.trim(), 'fallback {"name":"does-not-exist","args":[],"flags":{},"params":{}}')
})

test('can call route with arguments and flags', async assert => {
  const { stdout } = await exec('node ./test/cli.js with-args and more -i=1 -b=hey')
  assert.equal(stdout.trim(), 'with-args {"name":"with-args","args":["and","more"],"flags":{"i":1,"b":"hey"},"params":{}}')
})

test('can call route with params', async assert => {
  const { stdout } = await exec('node ./test/cli.js with-params yay yayo -i=1 -b=hey')
  assert.equal(stdout.trim(), 'with-params {"name":"with-params","args":[],"flags":{"i":1,"b":"hey"},"params":{"param1":"yay","param2":"yayo"}}')
})

test('can not call route with params without specifying all params', async assert => {
  assert.plan(1)
  try {
    await exec('node ./test/cli.js with-params this-needs-two')
  } catch(error) {
    assert.include(error.message, 'parameter param2 is missing!')
  }
})

test('can call route with params without specifying all params if they are optional', async assert => {
  const { stdout } = await exec('node ./test/cli.js with-optional')
  assert.equal(stdout.trim(), 'with-optional {"name":"with-optional","args":[],"flags":{},"params":{"param1":null}}')
})
