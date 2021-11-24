const test = require('japa')
const { Cli } = require('../dist')

function run(cli, args) {
  process.argv = args.split(' ')
  cli.serve()
}

test('will list all available routes if default route is not specified', async assert => {
  let response = ''
  const report = (value) => response = value
  new Cli({ report })
    .route('make {project?}', () => {})
    .route('build {project}', () => {})
    .group('db', group => {
      group.route('migrate', () => {})
    })
    .serve()

  assert.equal(response, `make {project?}
build {project}
db:migrate
`)
})

test('will call default route if no argument is provided', async assert => {
  assert.plan(1)
  const cli = new Cli().default(context => {
    assert.deepEqual(context, {"name": undefined, "args":[],"flags":{"f":true},"params":{}})
  })

  run(cli, 'node my-cli -f')
})

test('will crash for unknown route when no fallback is provided', async assert => {
  let response = ''
  const report = (value) => response = value
  const cli = new Cli({ report })
  run(cli, 'node my-cli unknown')
  assert.include(response, 'The route "unknown" was not found.')
})

test('fallback will provide alternative routes', assert => {
  let response = ''
  const report = (value) => response = value
  const cli = new Cli({ report }).route('db:migrate', () => {}).route('db:dump', () => {})

  run(cli, 'node my-cli db')
  assert.include(response, 'The route "db" was not found. Maybe you meant: db:migrate, db:dump.')
})

test('will call fallback if route was not found', async assert => {
  assert.plan(1)
  const cli = new Cli().fallback(context => {
    assert.deepEqual(context, {"name":"does-not-exist","args":[],"flags":{},"params":{}})
  })

  run(cli, 'node my-cli does-not-exist')
})

test('can call route with arguments and flags', async assert => {
  assert.plan(1)
  const cli = new Cli().route('with-args', context => {
    assert.deepEqual(context, {"name":"with-args","args":["and","more"],"flags":{"i":1,"b":"hey"},"params":{}})
  })

  run(cli, 'node my-cli with-args and more -i=1 -b hey')
})

test('can call route with params', async assert => {
  assert.plan(1)
  const cli = new Cli().route('with-params {param1} {param2}', context => {
    assert.deepEqual(context, {"name":"with-params","args":[],"flags":{"i":1,"b":"hey"},"params":{"param1":"yay","param2":"yayo"}})
  })

  run(cli, 'node my-cli with-params yay yayo -i=1 -b=hey')
})

test('can not call route with params without specifying all params', async assert => {
  assert.plan(1)
  const cli = new Cli().route('with-params {param1} {param2}', () => {})

  try {
    run(cli, 'node my-cli with-params this-needs-two')
  } catch(error) {
    assert.include(error.message, 'parameter param2 is missing!')
  }
})

test('can call route with params without specifying all params if they are optional', async assert => {
  assert.plan(1)
  const cli = new Cli().route('with-optional {param1?}', context => {
    assert.deepEqual(context, {"name":"with-optional","args":[],"flags":{},"params":{"param1":null}})
  })

  run(cli, 'node my-cli with-optional')
})

test('can create groups', assert => {
  assert.plan(1)
  const cli = new Cli().group('db', group => {
    group.route('migrate', context => {
      assert.deepEqual(context, {"name":"db:migrate","args":[],"flags":{},"params":{}})
    })
  })

  run(cli, 'node my-cli db:migrate')
})

test('route groups get reset after the callback', assert => {
  assert.plan(1)
  const cli = new Cli().group('db', group => {})
    .route('migrate', context => {
      assert.deepEqual(context, {"name":"migrate","args":[],"flags":{},"params":{}})
    })

  run(cli, 'node my-cli migrate')
})

test('can not create nested groups', assert => {
  assert.plan(1)
  
  try {
    new Cli().group('db', group => {
      group.group('haha', context => {})
    })
  } catch(error) {
    assert.include(error.message, 'Nested groups are not supported.')
  }
})

test.group('help', group => {
  group.test('cli can have a description', (assert) => {
    let response = ''
    const report = (value) => response = value
    const cli = new Cli({ report }).description('My CLI!')

    run(cli, 'node my-cli')
    assert.equal(response, 'My CLI!\n\n')
  })

  group.test('individual routes can have a description and calling it will not execute it', (assert) => {
    let response = ''
    const report = (value) => response = value
    const cli = new Cli({ report }).route('make', () => {
      response = 'this text should not appear in response...'
    }, { description: 'My Route!' })

    run(cli, 'node my-cli make -h')
    assert.equal(response, 'make - My Route!')
  })

  group.test('cli description + routes', (assert) => {
    let response = ''
    const report = (value) => response = value
    const cli = new Cli({ report })
      .description('My CLI!')
      .route('make', () => {}, { description: 'My Route!' })
      .route('build {project?}', () => {}, { description: 'My Second Route!' })
      .route('nothing', () => {})

    run(cli, 'node my-cli -h')
    assert.equal(response, 'My CLI!\n\nmake - My Route!\nbuild {project?} - My Second Route!\nnothing\n')
  })

  group.test('prints help with -h even when alternative default is specified', (assert) => {
    let response = ''
    const report = (value) => response = value
    const cli = new Cli({ report }).description('My CLI!').default(() => {})

    run(cli, 'node my-cli')
    assert.equal(response, '')

    run(cli, 'node my-cli -h')
    assert.equal(response, 'My CLI!\n\n')
  })
})