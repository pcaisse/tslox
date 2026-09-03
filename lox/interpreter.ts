import Token from "./token.ts";
import type {
  AssignExpr,
  BinaryExpr,
  CallExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  LogicalExpr,
  UnaryExpr,
  VariableExpr,
  VisitorExpr,
} from "./expr.ts";
import { TOKEN_TYPE } from "./tokenType.ts";
import type { Literal } from "./types.ts";
import {
  ReturnStmt,
  type BlockStmt,
  type ExprStmt,
  type FunctionStmt,
  type IfStmt,
  type PrintStmt,
  type Stmt,
  type VarStmt,
  type VisitorStmt,
  type WhileStmt,
} from "./stmt.ts";
import Environment from "./environment.ts";
import { ClockCallable } from "./callable.ts";
import LoxFunction from "./function.ts";
import Return from "./return.ts";
import { RuntimeError } from "./error.ts";

export default class Interpreter implements VisitorExpr, VisitorStmt {
  globals: Environment = new Environment();
  #environment = this.globals;
  runtimeError: (error: RuntimeError) => void;
  #locals: Map<Expr, number> = new Map();

  constructor(runtimeError: (error: RuntimeError) => void) {
    this.runtimeError = runtimeError;
    this.globals.define("clock", new ClockCallable());
  }

  interpret(statements: Stmt[]): void {
    try {
      for (const statement of statements) {
        this.#execute(statement);
      }
    } catch (error) {
      if (error instanceof RuntimeError) this.runtimeError(error);
    }
  }

  visitBinaryExpr(expr: BinaryExpr) {
    const left = this.#evaluate(expr.left);
    const right = this.#evaluate(expr.right);

    switch (expr.operator.type) {
      case TOKEN_TYPE.GREATER:
        this.#checkNumberOperands(expr.operator, left, right);
        return (left as number) > (right as number);
      case TOKEN_TYPE.GREATER_EQUAL:
        this.#checkNumberOperands(expr.operator, left, right);
        return (left as number) >= (right as number);
      case TOKEN_TYPE.LESS:
        this.#checkNumberOperands(expr.operator, left, right);
        return (left as number) < (right as number);
      case TOKEN_TYPE.LESS_EQUAL:
        this.#checkNumberOperands(expr.operator, left, right);
        return (left as number) <= (right as number);
      case TOKEN_TYPE.MINUS:
        this.#checkNumberOperands(expr.operator, left, right);
        return (left as number) - (right as number);
      case TOKEN_TYPE.PLUS:
        if (typeof left === "number" && typeof right === "number") {
          return left + right;
        }
        if (typeof left === "string" && typeof right === "string") {
          return left + right;
        }
        throw new RuntimeError(
          "Operands must be two numbers or two strings.",
          expr.operator,
        );
      case TOKEN_TYPE.SLASH:
        this.#checkNumberOperands(expr.operator, left, right);
        return (left as number) / (right as number);
      case TOKEN_TYPE.STAR:
        this.#checkNumberOperands(expr.operator, left, right);
        return (left as number) * (right as number);
      case TOKEN_TYPE.BANG_EQUAL:
        return !this.#isEqual(left, right);
      case TOKEN_TYPE.EQUAL_EQUAL:
        return this.#isEqual(left, right);
    }

    // Unreachable.
    return null;
  }

  visitCallExpr(expr: CallExpr) {
    const callee = this.#evaluate(expr.callee);

    const args = [];
    for (const arg of expr.args) {
      args.push(this.#evaluate(arg));
    }

    if (!(callee instanceof LoxFunction)) {
      throw new RuntimeError(
        "Can only call functions and classes, not " + callee,
        expr.paren,
      );
    }

    if (args.length !== callee.arity()) {
      throw new RuntimeError(
        "Expected " +
          callee.arity() +
          " arguments but got " +
          args.length +
          ".",
        expr.paren,
      );
    }

    return callee.call(this, args);
  }

  visitGroupingExpr(expr: GroupingExpr) {
    return this.#evaluate(expr.expression);
  }

  visitLiteralExpr(expr: LiteralExpr) {
    return expr.value;
  }

  visitLogicalExpr(expr: LogicalExpr) {
    const left = this.#evaluate(expr.left);

    if (expr.operator.type === TOKEN_TYPE.OR) {
      if (this.#isTruthy(left)) return left;
    } else {
      if (!this.#isTruthy(left)) return left;
    }

    return this.#evaluate(expr.right);
  }

  visitUnaryExpr(expr: UnaryExpr): Literal {
    const right = this.#evaluate(expr.right);

    switch (expr.operator.type) {
      case TOKEN_TYPE.BANG:
        return !this.#isTruthy(right);
      case TOKEN_TYPE.MINUS:
        this.#checkNumberOperand(expr.operator, right);
        return -(right as number);
    }

    // Unreachable.
    return null;
  }

  visitVariableExpr(expr: VariableExpr): Literal {
    const variable = this.#lookUpVariable(expr.name, expr);
    if (variable === undefined) {
      throw new Error(`Unable to look up variable '${expr.name}'`);
    }
    return variable;
  }

  #lookUpVariable(name: Token, expr: Expr) {
    const distance: number | undefined = this.#locals.get(expr);
    if (distance !== undefined) {
      return this.#environment.getAt(distance, name.lexeme);
    }
    return this.globals.get(name);
  }

  #checkNumberOperand(operator: Token, operand: Literal) {
    if (typeof operand === "number") return;
    throw new RuntimeError("Operand must be a number.", operator);
  }

  #checkNumberOperands(operator: Token, left: Literal, right: Literal) {
    if (typeof left === "number" && typeof right === "number") return;
    throw new RuntimeError("Operands must be numbers.", operator);
  }

  #evaluate(expr: Expr): Literal {
    return expr.accept(this);
  }

  #execute(statement: Stmt) {
    statement.accept(this);
  }

  resolve(expr: Expr, depth: number) {
    this.#locals.set(expr, depth);
  }

  executeBlock(statements: Stmt[], environment: Environment): void {
    const previous = this.#environment;
    try {
      this.#environment = environment;
      for (const statement of statements) {
        this.#execute(statement);
      }
    } finally {
      this.#environment = previous;
    }
  }

  visitBlockStmt(stmt: BlockStmt): void {
    this.executeBlock(stmt.statements, new Environment(this.#environment));
  }

  visitExprStmt(stmt: ExprStmt): void {
    this.#evaluate(stmt.expression);
  }

  visitFunctionStmt(stmt: FunctionStmt): void {
    const func = new LoxFunction(stmt, this.#environment);
    this.#environment.define(stmt.name.lexeme, func);
  }

  visitIfStmt(stmt: IfStmt): void {
    if (this.#isTruthy(this.#evaluate(stmt.condition))) {
      this.#execute(stmt.thenBranch);
    } else if (stmt.elseBranch !== null) {
      this.#execute(stmt.elseBranch);
    }
  }

  visitPrintStmt(stmt: PrintStmt): void {
    const value = this.#evaluate(stmt.expression);
    console.log(value);
  }

  visitReturnStmt(stmt: ReturnStmt): void {
    const value = stmt.value !== null ? this.#evaluate(stmt.value) : stmt.value;
    throw new Return(value);
  }

  visitVarStmt(stmt: VarStmt): void {
    const value =
      stmt.initializer !== null ? this.#evaluate(stmt.initializer) : null;
    this.#environment.define(stmt.name.lexeme, value);
  }

  visitWhileStmt(stmt: WhileStmt): void {
    while (this.#isTruthy(this.#evaluate(stmt.condition))) {
      this.#execute(stmt.body);
    }
  }

  visitAssignExpr(expr: AssignExpr): Literal {
    const value = this.#evaluate(expr.value);
    const distance = this.#locals.get(expr);
    if (distance !== undefined) {
      this.#environment.assignAt(distance, expr.name, value);
    } else {
      this.globals.assign(expr.name, value);
    }
    return value;
  }

  #isTruthy(literal: Literal): boolean {
    if (literal === null) return false;
    if (typeof literal === "boolean") return literal;
    return true;
  }

  #isEqual(a: Literal, b: Literal) {
    if (a === null && b === null) return true;
    if (a === null) return false;

    return a === b;
  }
}
