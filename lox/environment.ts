import { RuntimeError } from "./interpreter";
import Token from "./token";
import type { Literal } from "./types";

export default class Environment {
  #values: Map<string, Literal> = new Map();

  define(name: string, value: Literal): void {
    this.#values.set(name, value);
  }

  get(name: Token): Literal {
    const value = this.#values.get(name.lexeme);
    if (!value) {
      throw new RuntimeError("Undefined variable '" + name.lexeme + "'.", name);
    }
    return value;
  }
}
