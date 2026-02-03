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

  assign(name: Token, value: Literal): void {
    if (this.#values.has(name.lexeme)) {
      this.#values.set(name.lexeme, value);
      return;
    }
    throw new RuntimeError("Undefined variable '" + name.lexeme + "'.", name);
  }
}
