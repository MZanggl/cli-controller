import * as minimist from 'minimist'
import { RouteResolver, CallbackContext } from './types'
import { given } from 'flooent'

function serve(controller: Cli) {
  const { _: allArgs, ...flags } = minimist(process.argv.slice(2))
  const [ name, ...args ] = allArgs
  const context: CallbackContext = { name, args, flags, params: {} }

  if (!name) {
    return controller._options.default(context)
  }

  const route = controller._options.routes.get(name)
  if (!route) {
    return controller._options.fallback(context)
  }

  context.params = route.params.reduce((acc, key) => {
    const [value] = context.args.splice(0, 1)
    const isOptional = key.endsWith('?')
    if (isOptional) key = given.string(key).beforeLast('?').valueOf()
    if (!isOptional && value === undefined) throw new Error(`parameter ${key} is missing!`)
    acc[key] = value ?? null
    return acc
  }, {})

  route.resolver(context)
}

export class Cli {
  _options = {
    routes: new Map(),
    fallback({name}: CallbackContext): void {
      throw new Error(`route "${name}" was not found.`)
    },
    default(context: CallbackContext) {
      this.fallback(context)
    }
  }

  fallback(callback: ((context: CallbackContext) => void)) {
    this._options.fallback = callback
    return this
  }

  default(callback: ((context: CallbackContext) => void)) {
    this._options.default = callback
    return this
  }

  route<T, F>(name: string, resolver: RouteResolver<T, F>) {
    const [params, nameParts] = given.array(name.split(' ')).partition(name => name.startsWith('{'))

    this._options.routes.set(nameParts[0], {
      resolver,
      params: params.map(param => given.string(param).between('{').and('}'))
    })
    return this
  }

  serve() {
    serve(this)
  }
}

export { RouteResolver }
