import type LoxCallable from "./callable";
import Environment from "./environment";
import type Interpreter from "./interpreter";
import Return from "./return";
import type { FunctionStmt } from "./stmt";
import type { Literal } from "./types";

export default class LoxFunction implements LoxCallable {
  #declaration: FunctionStmt;
  constructor(declaration: FunctionStmt) {
    this.#declaration = declaration;
  }

  call(interpreter: Interpreter, args: Literal[]): Literal {
    const environment = new Environment(interpreter.globals);
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
