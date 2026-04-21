import { RuntimeError } from "./error";
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

  #ancestor(distance: number) {
    let environment: Environment = this;
    for (let i = 0; i < distance; i++) {
      if (environment.enclosing === undefined) break;
      environment = environment.enclosing;
    }
    return environment;
  }

  getAt(distance: number, name: string) {
    return this.#ancestor(distance).#values.get(name);
  }

  assignAt(distance: number, name: Token, value: Literal) {
    this.#ancestor(distance).#values.set(name.lexeme, value);
  }

  get(name: Token): Literal {
    const value = this.#values.get(name.lexeme);

    if (value !== undefined) {
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
