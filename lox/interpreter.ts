import Token from "./token";
import type {
  BinaryExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
  Visitor,
} from "./expr";
import { TokenType } from "./tokenType";
import type { Literal } from "./types";

export class RuntimeError extends Error {
  token: Token;

  constructor(message: string, token: Token) {
    super(message);
    this.token = token;
  }
}

export default class Interpreter implements Visitor {
  runtimeError: (error: RuntimeError) => void;

  constructor(runtimeError: (error: RuntimeError) => void) {
    this.runtimeError = runtimeError;
  }

  interpret(expression: Expr): void {
    try {
      const value = this.#evaluate(expression);
      console.log(value);
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
