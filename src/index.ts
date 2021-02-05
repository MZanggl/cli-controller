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
    currentGroup: null,
    routes: new Map(),
    fallback({name}: CallbackContext): void {
      let message = `The route "${name}" was not found.`
      const alternatives = [...this.routes.keys()].filter(key => key.includes(name)).join(', ')

      if (alternatives.length > 0) {
        message += ` Maybe you meant: ${alternatives}.`
      }

      throw new Error(message)
    },
    default: (context: CallbackContext) => {
      console.table(this.routeList())
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

  group(name: string, callback: (cli: Cli) => void) {
    if (this._options.currentGroup) {
      throw new Error('Nested groups are not supported.')
    }

    this._options.currentGroup = name
    callback(this)
    this._options.currentGroup = null

    return this
  }
  
  private makeRouteName(route) {
    if (!this._options.currentGroup) {
      return route
    }
    return `${this._options.currentGroup}:${route}`
  }

  route<T, F>(name: string, resolver: RouteResolver<T, F>) {
    const [params, nameParts] = given.array(name.split(' ')).partition(name => name.startsWith('{'))

    this._options.routes.set(this.makeRouteName(nameParts[0]), {
      raw: this.makeRouteName(name),
      resolver,
      params: params.map(param => given.string(param).between('{').and('}'))
    })
    return this
  }

  routeList() {
    return [...this._options.routes.values()].map(route => {
      return { Name: route.raw }
    })
  }

  serve() {
    serve(this)
  }
}

export { RouteResolver }
