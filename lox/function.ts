export default class LoxFunction implements LoxCallable {
  #declaration: FunctionStmt;
  constructor(declaration: FunctionStmt) {
    this.#declaration = declaration;
  }
}
