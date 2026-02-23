import Token from "./token";
import type {
  AssignExpr,
  BinaryExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  LogicalExpr,
  UnaryExpr,
  VariableExpr,
  VisitorExpr,
} from "./expr";
import { TokenType } from "./tokenType";
import type { Literal } from "./types";
import type {
  BlockStmt,
  ExprStmt,
  IfStmt,
  PrintStmt,
  Stmt,
  VarStmt,
  VisitorStmt,
  WhileStmt,
} from "./stmt";
import Environment from "./environment";

export class RuntimeError extends Error {
  token: Token;

  constructor(message: string, token: Token) {
    super(message);
    this.token = token;
  }
}

export default class Interpreter implements VisitorExpr, VisitorStmt {
  #environment: Environment = new Environment();
  runtimeError: (error: RuntimeError) => void;

  constructor(runtimeError: (error: RuntimeError) => void) {
    this.runtimeError = runtimeError;
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
      case TokenType.GREATER:
        this.#checkNumberOperands(expr.operator, left, right);
        return (left as number) > (right as number);
      case TokenType.GREATER_EQUAL:
        this.#checkNumberOperands(expr.operator, left, right);
        return (left as number) >= (right as number);
      case TokenType.LESS:
        this.#checkNumberOperands(expr.operator, left, right);
        return (left as number) < (right as number);
      case TokenType.LESS_EQUAL:
        this.#checkNumberOperands(expr.operator, left, right);
        return (left as number) <= (right as number);
      case TokenType.MINUS:
        this.#checkNumberOperands(expr.operator, left, right);
        return (left as number) - (right as number);
      case TokenType.PLUS:
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
      case TokenType.SLASH:
        this.#checkNumberOperands(expr.operator, left, right);
        return (left as number) / (right as number);
      case TokenType.STAR:
        this.#checkNumberOperands(expr.operator, left, right);
        return (left as number) * (right as number);
      case TokenType.BANG_EQUAL:
        return !this.#isEqual(left, right);
      case TokenType.EQUAL_EQUAL:
        return this.#isEqual(left, right);
    }

    // Unreachable.
    return null;
  }

  visitGroupingExpr(expr: GroupingExpr) {
    return this.#evaluate(expr.expression);
  }

  visitLiteralExpr(expr: LiteralExpr) {
    return expr.value;
  }

  visitLogicalExpr(expr: LogicalExpr) {
    const left = this.#evaluate(expr.left);

    if (expr.operator.type === TokenType.OR) {
      if (this.#isTruthy(left)) return left;
    } else {
      if (!this.#isTruthy(left)) return left;
    }

    return this.#evaluate(expr.right);
  }

  visitUnaryExpr(expr: UnaryExpr): Literal {
    const right = this.#evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.BANG:
        return !this.#isTruthy(right);
      case TokenType.MINUS:
        this.#checkNumberOperand(expr.operator, right);
        return -(right as number);
    }

    // Unreachable.
    return null;
  }

  visitVariableExpr(expr: VariableExpr): Literal {
    return this.#environment.get(expr.name);
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

  #executeBlock(statements: Stmt[], environment: Environment): void {
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
    this.#executeBlock(stmt.statements, new Environment(this.#environment));
  }

  visitExprStmt(stmt: ExprStmt): void {
    this.#evaluate(stmt.expression);
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
    this.#environment.assign(expr.name, value);
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
