import Token from "./token";

interface Visitor {
  visitBinary: (binary: BinaryExpr) => void;
  visitGrouping: (grouping: GroupingExpr) => void;
  visitLiteral: (literal: LiteralExpr) => void;
  visitUnary: (unary: UnaryExpr) => void;
}

export abstract class Expr {
  abstract accept: (visitor: Visitor) => void;
}

export class BinaryExpr implements Expr {
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

export class GroupingExpr implements Expr {
  expression: Expr;

  constructor(expression: Expr) {
    this.expression = expression;
  }

  accept(visitor: Visitor): void {
    visitor.visitGrouping(this);
  }
}

export class LiteralExpr implements Expr {
  value: string | number | boolean | null;

  constructor(value: string | number | boolean | null) {
    this.value = value;
  }

  accept(visitor: Visitor): void {
    visitor.visitLiteral(this);
  }
}

export class UnaryExpr implements Expr {
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
