const test = require('japa')
const { Cli } = require('../dist')

let simulatedContext
const returnContext = (context) => simulatedContext = context
function fakeCli(...buildingBlocks) {
  const cli = new Cli()
  for (const [method, routeName] of buildingBlocks) {
    if (method === 'route') {
      cli[method](routeName, returnContext)
    } else {
      cli[method](returnContext)
    }
  }

  return {
    exec(args) {
      process.argv = ['node', 'fake-cli', ...args.split(' ')]
      cli.serve()
      return simulatedContext
    }
  }
}

test('will call default route if no argument is provided', async assert => {
  const cli = fakeCli(['default'])
  const context = cli.exec('-h')
  assert.deepEqual(context, {"name": undefined, "args":[],"flags":{"h":true},"params":{}})
})

test('will crash for unknown route when no fallback is provided', async assert => {
  const cli = fakeCli()
  assert.plan(1)
  try {
    cli.exec('unknown')
  } catch(error) {
    assert.include(error.message, 'route "unknown" was not found.')
  }
})

test('will call fallback if route was not found', async assert => {
  const cli = fakeCli(['fallback'])
  const context = cli.exec('does-not-exist')
  assert.deepEqual(context, {"name":"does-not-exist","args":[],"flags":{},"params":{}})
})

test('can call route with arguments and flags', async assert => {
  const cli = fakeCli(['route', 'with-args'])
  const context = cli.exec('with-args and more -i=1 -b hey')
  assert.deepEqual(context, {"name":"with-args","args":["and","more"],"flags":{"i":1,"b":"hey"},"params":{}})
})

test('can call route with params', async assert => {
  const cli = fakeCli(['route', 'with-params {param1} {param2}'])
  const context = cli.exec('with-params yay yayo -i=1 -b=hey')
  assert.deepEqual(context, {"name":"with-params","args":[],"flags":{"i":1,"b":"hey"},"params":{"param1":"yay","param2":"yayo"}})
})

test('can not call route with params without specifying all params', async assert => {
  const cli = fakeCli(['route', 'with-params {param1} {param2}'])
  assert.plan(1)
  try {
    cli.exec('with-params this-needs-two')
  } catch(error) {
    assert.include(error.message, 'parameter param2 is missing!')
  }
})

test('can call route with params without specifying all params if they are optional', async assert => {
  const cli = fakeCli(['route', 'with-optional {param1?}'])
  const context = cli.exec('with-optional')
  assert.deepEqual(context, {"name":"with-optional","args":[],"flags":{},"params":{"param1":null}})
})
