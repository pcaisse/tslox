import Token from "./token";

interface Visitor {
  visitBinary: (binary: Binary) => void;
  visitGrouping: (grouping: Grouping) => void;
  visitLiteral: (literal: Literal) => void;
  visitUnary: (unary: Unary) => void;
}

abstract class Expr {
  abstract accept: (visitor: Visitor) => void;
}

export class Binary implements Expr {
  left: Expr;
  operator: Token;
  right: Expr;

  constructor(left: Expr, operator: Token, right: Expr) {
    this.left = left;
    this.operator = operator;
    this.right = right;
  }

  accept(visitor: Visitor): void {
    visitor.visitBinary(this);
  }
}

export class Grouping implements Expr {
  expression: Expr;

  constructor(expression: Expr) {
    this.expression = expression;
  }

  accept(visitor: Visitor): void {
    visitor.visitGrouping(this);
  }
}

export class Literal implements Expr {
  value: object;

  constructor(value: object) {
    this.value = value;
  }

  accept(visitor: Visitor): void {
    visitor.visitLiteral(this);
  }
}

export class Unary implements Expr {
  operator: Token;
  right: Expr;

  constructor(operator: Token, right: Expr) {
    this.operator = operator;
    this.right = right;
  }

  accept(visitor: Visitor): void {
    visitor.visitUnary(this);
  }
}
