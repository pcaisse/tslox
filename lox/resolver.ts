import {
  AssignExpr,
  BinaryExpr,
  CallExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  LogicalExpr,
  UnaryExpr,
  VariableExpr,
  type VisitorExpr,
} from "./expr.ts";
import Token from "./token.ts";
import type Interpreter from "./interpreter.ts";
import type {
  BlockStmt,
  ExprStmt,
  FunctionStmt,
  IfStmt,
  PrintStmt,
  ReturnStmt,
  Stmt,
  VarStmt,
  VisitorStmt,
  WhileStmt,
} from "./stmt.ts";
import { RuntimeError } from "./error.ts";
import { TOKEN_TYPE } from "./tokenType.ts";

type FunctionType = "function" | "none";

export default class Resolver implements VisitorExpr, VisitorStmt {
  #interpreter: Interpreter;
  #scopes: Map<string, boolean>[] = [];
  #currentFunction: FunctionType = "none";
  #report: (line: number, where: string, message: string) => void;

  constructor(
    interpreter: Interpreter,
    report: (line: number, where: string, message: string) => void,
  ) {
    this.#interpreter = interpreter;
    this.#report = report;
  }

  #error(token: Token, message: string) {
    this.#report(
      token.line,
      token.type === TOKEN_TYPE.EOF ? " at end" : " at '" + token.lexeme + "'",
      message,
    );
  }

  visitBlockStmt(stmt: BlockStmt): void {
    this.#beginScope();
    this.resolve(stmt.statements);
    this.#endScope();
  }

  visitExprStmt(stmt: ExprStmt): void {
    this.#resolveExpr(stmt.expression);
  }

  visitFunctionStmt(stmt: FunctionStmt): void {
    this.#declare(stmt.name);
    this.#define(stmt.name);
    this.#resolveFunction(stmt, "function");
  }

  visitIfStmt(stmt: IfStmt): void {
    this.#resolveExpr(stmt.condition);
    this.#resolveStmt(stmt.thenBranch);
    if (stmt.elseBranch !== null) {
      this.#resolveStmt(stmt.elseBranch);
    }
  }

  visitPrintStmt(stmt: PrintStmt): void {
    this.#resolveExpr(stmt.expression);
  }

  visitReturnStmt(stmt: ReturnStmt): void {
    if (this.#currentFunction === "none") {
      this.#error(stmt.keyword, "Can't return from top-level code");
    }
    if (stmt.value !== null) {
      this.#resolveExpr(stmt.value);
    }
  }

  visitVarStmt(stmt: VarStmt): void {
    this.#declare(stmt.name);
    if (stmt.initializer !== null) {
      this.#resolveExpr(stmt.initializer);
    }
    this.#define(stmt.name);
  }

  visitWhileStmt(stmt: WhileStmt): void {
    this.#resolveExpr(stmt.condition);
    this.#resolveStmt(stmt.body);
  }

  visitAssignExpr(expr: AssignExpr): null {
    this.#resolveExpr(expr.value);
    this.#resolveLocal(expr, expr.name);
    return null;
  }

  visitBinaryExpr(expr: BinaryExpr): null {
    this.#resolveExpr(expr.left);
    this.#resolveExpr(expr.right);
    return null;
  }

  visitCallExpr(expr: CallExpr): null {
    this.#resolveExpr(expr.callee);

    for (let arg of expr.args) {
      this.#resolveExpr(arg);
    }

    return null;
  }

  visitGroupingExpr(expr: GroupingExpr): null {
    this.#resolveExpr(expr.expression);
    return null;
  }

  visitLiteralExpr(_expr: LiteralExpr): null {
    return null;
  }

  visitLogicalExpr(expr: LogicalExpr): null {
    this.#resolveExpr(expr.left);
    this.#resolveExpr(expr.right);
    return null;
  }

  visitUnaryExpr(expr: UnaryExpr): null {
    this.#resolveExpr(expr.right);
    return null;
  }

  visitVariableExpr(expr: VariableExpr): null {
    const scope = this.#scopes[this.#scopes.length - 1];
    if (scope && scope.get(expr.name.lexeme) === false) {
      throw new RuntimeError(
        "Can't read local variable in its own initializer",
        expr.name,
      );
    }
    this.#resolveLocal(expr, expr.name);
    return null;
  }

  resolve(stmts: Stmt[]) {
    for (const stmt of stmts) {
      this.#resolveStmt(stmt);
    }
  }

  #resolveFunction(func: FunctionStmt, type: FunctionType) {
    let enclosingFunction = this.#currentFunction;
    this.#currentFunction = type;
    this.#beginScope();
    for (let param of func.params) {
      this.#declare(param);
      this.#define(param);
    }
    this.resolve(func.body);
    this.#endScope();
    this.#currentFunction = enclosingFunction;
  }

  #declare(name: Token) {
    const scope = this.#scopes[this.#scopes.length - 1];
    if (scope === undefined) return;
    if (scope.has(name.lexeme)) {
      this.#error(name, "Already a variable with this name in this scope.");
    }
    scope.set(name.lexeme, false);
  }

  #define(name: Token) {
    const scope = this.#scopes[this.#scopes.length - 1];
    if (scope === undefined) return;
    scope.set(name.lexeme, true);
  }

  #resolveLocal(expr: Expr, name: Token) {
    for (let i = this.#scopes.length - 1; i >= 0; i--) {
      const scope = this.#scopes[i];
      if (scope && scope.has(name.lexeme)) {
        this.#interpreter.resolve(expr, this.#scopes.length - 1 - i);
      }
    }
  }

  #beginScope() {
    this.#scopes.push(new Map<string, boolean>());
  }

  #endScope() {
    this.#scopes.pop();
  }

  #resolveStmt(stmt: Stmt) {
    stmt.accept(this);
  }

  #resolveExpr(expr: Expr) {
    expr.accept(this);
  }
}
