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
