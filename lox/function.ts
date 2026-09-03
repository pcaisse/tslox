import type LoxCallable from "./callable.ts";
import Environment from "./environment.ts";
import type Interpreter from "./interpreter.ts";
import Return from "./return.ts";
import type { FunctionStmt } from "./stmt.ts";
import type { Literal } from "./types.ts";

export default class LoxFunction implements LoxCallable {
  #declaration: FunctionStmt;
  #closure: Environment;
  constructor(declaration: FunctionStmt, closure: Environment) {
    this.#declaration = declaration;
    this.#closure = closure;
  }

  call(interpreter: Interpreter, args: Literal[]): Literal {
    const environment = new Environment(this.#closure);
    this.#declaration.params.forEach((value, i) => {
      environment.define(value.lexeme, args[i] as Literal);
    });

    try {
      interpreter.executeBlock(this.#declaration.body, environment);
    } catch (maybeReturn) {
      if (maybeReturn instanceof Return) {
        return maybeReturn.value;
      }
      throw maybeReturn;
    }
    return null;
  }

  arity() {
    return this.#declaration.params.length;
  }

  toString() {
    return "<fn " + this.#declaration.name.lexeme + ">";
  }
}
