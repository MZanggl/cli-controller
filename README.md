# Super simple CLI controller

> `npm install cli-controller`

> Of course you can make a proper CLI out of it using the "bin" field in package.json

## Examples

### Most basic form

To create a cli like this:

```bash
node ./index.js hello
```

write the following `index.js`.

```javascript
// index.js
const { Cli } = require('cli-controller')

new Cli().route('hello', () => 'world').serve()
```

### Arguments and flags

```bash
node ./index.js make something amazing --please --v=1 --hey=you
```

```javascript
// index.js
const { Cli } = require('cli-controller')

new Cli()
  .route('make', ({ args, flags }) => {
    console.log(args) // ['something', 'amazing']
    console.log(flags) // { please: true, v: 1, hey: 'you' }
  })
  // .route('hello', () => 'world') <-- you can chain `.route`
  .serve()
```

### Default callback when no argument is passed (excluding flags)

```bash
node ./index.js
```

```javascript
// index.js
const { Cli } = require('cli-controller')

new Cli()
  // .route('hello', () => 'world')
  .default(({ flags }) => {
    console.log('default!')
  })
  .serve()
```

### Cleaner API with params

Consider the code for the following CLI `node ./index.js build my-app`

```javascript
new Cli()
  .route('build', ({ args }) => {
    const [project] = args
  })
  .serve()
```

It can be expressed much clearer using params:

```javascript
new Cli()
  .route('build {project}', ({ params }) => {
    console.log(params) // { project: 'my-app' }
  })
  .serve()
```

If the parameter is not specified, it will raise an exception. You can mark params optional like so:

```javascript
new Cli()
  .route('build {project?}', ({ params }) => {})
  .serve()
```

### Group routes

Group common routes together to create the following API:

```bash
node ./index.js db:migrate
node ./index.js db:dump
```

```javascript
new Cli()
  .group('db', group => {
    group.route('migrate', context => {})
    group.route('dump', context => {})
  })
  .serve()
```

### Fallback when route was not found

By default, it will raise an exception.

```bash
node ./index.js does-not-exist
```

```javascript
// index.js
const { Cli } = require('cli-controller')

new Cli()
  .fallback(({ name, args, flags }) => {
    console.log('not found!', name)
  })
  .serve()
```

### Alternative API

You don't need an endless chain if you don't want! This is also possible:


```javascript
const cli = new Cli()

cli.route('build {project}', (context) => {})

cli.serve()
```