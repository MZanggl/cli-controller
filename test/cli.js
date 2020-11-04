const { Cli } = require('../dist')

new Cli()
  .route('with-args', (context) => {
    console.log('with-args', JSON.stringify(context))
  })
  .route('with-params {param1} {param2}', (context) => {
    console.log('with-params', JSON.stringify(context))
  })
  .route('with-optional {param1?}', (context) => {
    console.log('with-optional', JSON.stringify(context))
  })
  .fallback((context) => console.log('fallback', JSON.stringify(context)))
  .default((context) => console.log('default', JSON.stringify(context)))
  .serve()