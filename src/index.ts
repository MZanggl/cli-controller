import * as minimist from 'minimist'
import { RouteResolver, CallbackContext } from './types'

function serve(controller: Cli) {
  const { _: allArgs, ...flags } = minimist(process.argv.slice(2))
  const [ name, ...args ] = allArgs
  const context: CallbackContext = { name, args, flags }

  if (!name) {
    return controller._options.default(context)
  }

  const resolver = controller._options.routes.get(name)
  if (!resolver) {
    return controller._options.fallback(context)
  }

  resolver(context)
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
    this._options.routes.set(name, resolver)
    return this
  }

  serve() {
    serve(this)
  }
}

export { RouteResolver }
