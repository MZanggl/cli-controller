import * as minimist from 'minimist'
import { RouteResolver } from './types'

const routes = new Map()

function serve() {
  const { _: allArgs, ...flags } = minimist(process.argv.slice(2))
  const [ name, ...args ] = allArgs

  const resolver = routes.get(name)
  if (!resolver) {
    throw new Error(`route "${name}" was not found.`)
  }

  resolver(args, flags)
}

export function route<T, F>(name: string, resolver: RouteResolver<T, F>) {
  routes.set(name, resolver)
}

export function bootstrapCli(router) {
  router(route)
  serve()
}

export { RouteResolver }
