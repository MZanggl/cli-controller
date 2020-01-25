# Super simple CLI controller

```javascript
// index.js
const { bootstrapCli } = require('cli-controller')

bootstrapCli(route => {
  route('make', function make(args, flags) {
    console.log(args) // ['something', 'amazing']
    console.log(flags) // { please: true }
  })
})
```

Then you can execute it like this

```bash
node ./index.js make something amazing --please
```

> Of course you can make a proper CLI out of it using the "bin" field in package.json