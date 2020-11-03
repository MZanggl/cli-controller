export type RouteResolver<T, F> = (args: T, flags: F) => void;

export interface CallbackContext {
  name: string;
  args: string[];
  flags: {
    [key: string]: string | boolean | number;
  }
}