import { RuntimeError } from "./interpreter";
import Token from "./token";
import type { Literal } from "./types";

export default class Environment {
  enclosing: Environment | undefined;
  #values: Map<string, Literal> = new Map();

  constructor(enclosing?: Environment) {
    this.enclosing = enclosing;
  }

  define(name: string, value: Literal): void {
    this.#values.set(name, value);
  }

  get(name: Token): Literal {
    const value = this.#values.get(name.lexeme);

    if (value) {
      return value;
    }

    if (this.enclosing) {
      return this.enclosing.get(name);
    }

    throw new RuntimeError("Undefined variable '" + name.lexeme + "'.", name);
  }

  assign(name: Token, value: Literal): void {
    if (this.#values.has(name.lexeme)) {
      this.#values.set(name.lexeme, value);
      return;
    }

    if (this.enclosing) {
      this.enclosing.assign(name, value);
      return;
    }

    throw new RuntimeError("Undefined variable '" + name.lexeme + "'.", name);
  }
}
