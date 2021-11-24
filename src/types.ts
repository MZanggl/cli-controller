export type RouteResolver<T, F> = (args: T, flags: F) => void;

export interface CliConstructorOptions {
  report?: (value: string) => void;
}

export interface RouteOptions {
  description?: string;
}

export interface CallbackContext {
  name: string;
  args: string[];
  flags: {
    [key: string]: string | boolean | number;
  }
  params: {
    [key: string]: string;
  }
}