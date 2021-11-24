import * as minimist from 'minimist'
import { RouteResolver, RouteOptions, CallbackContext, CliConstructorOptions } from './types'
import { given } from 'flooent'

export class Cli {
  constructor(options: CliConstructorOptions = {}) {
    if (options.report) this._options.report = options.report
  }

  _options = {
    report: console.log.bind(console),
    description: '',
    currentGroup: null,
    routes: new Map(),
    fallback: ({name}: CallbackContext): void => {
      let message = `The route "${name}" was not found.`
      const alternatives = [...this._options.routes.keys()].filter(key => key.includes(name)).join(', ')

      if (alternatives.length > 0) {
        message += ` Maybe you meant: ${alternatives}.`
      }

      this._options.report(message)
    },
    default: (context: CallbackContext) => {
      this._options.report(this.help())
    }
  }

  description(description: string) {
    this._options.description = description
    return this
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

  route<T, F>(name: string, resolver: RouteResolver<T, F>, options: RouteOptions = {}) {
    const [params, nameParts] = given.array(name.split(' ')).partition(name => name.startsWith('{'))

    this._options.routes.set(this.makeRouteName(nameParts[0]), {
      raw: this.makeRouteName(name),
      resolver,
      options,
      params: params.map(param => given.string(param).after('{').before('}'))
    })
    return this
  }

  routeList() {
    return [...this._options.routes.values()].map(route => {
      return { Name: route.raw }
    })
  }

  private help(routeName?: string) {
    if (routeName) {
      const route = this._options.routes.get(routeName)
      const description = route.options.description ?? ''
      return [route.raw, description].filter(Boolean).join(' - ')
    }

    let help = this._options.description ? this._options.description + '\n\n' : ''
    for (const value of this._options.routes.values()) {
      const description = value.options.description ?? ''
      const row = [value.raw, description].filter(Boolean).join(' - ')
      help += `${row}\n`
    }
    return help
  }

  serve() {
    const { _: allArgs, ...flags } = minimist(process.argv.slice(2))
    const [ name, ...args ] = allArgs
    const context: CallbackContext = { name, args, flags, params: {} }

    let route

    if (name) {
      route = this._options.routes.get(name)
      if (!route) {
        return this._options.fallback(context)
      }
    }

    if (flags['h'] || flags['help']) {
      return this._options.report(this.help(name))
    }

    if (!name) {
      return this._options.default(context)
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
}

export { RouteResolver }
