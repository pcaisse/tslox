import Token from "./token";
import type { Literal } from "./types";

export interface VisitorExpr {
  visitBinaryExpr: (binary: BinaryExpr) => Literal;
  visitGroupingExpr: (grouping: GroupingExpr) => Literal;
  visitLiteralExpr: (literal: LiteralExpr) => Literal;
  visitUnaryExpr: (unary: UnaryExpr) => Literal;
  visitVariableExpr: (unary: VariableExpr) => Literal;
}

export abstract class Expr {
  abstract accept: (visitor: VisitorExpr) => Literal;
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

  accept(visitor: VisitorExpr): Literal {
    return visitor.visitBinaryExpr(this);
  }
}

export class GroupingExpr implements Expr {
  expression: Expr;

  constructor(expression: Expr) {
    this.expression = expression;
  }

  accept(visitor: VisitorExpr): Literal {
    return visitor.visitGroupingExpr(this);
  }
}

export class LiteralExpr implements Expr {
  value: Literal;

  constructor(value: Literal) {
    this.value = value;
  }

  accept(visitor: VisitorExpr): Literal {
    return visitor.visitLiteralExpr(this);
  }
}

export class UnaryExpr implements Expr {
  operator: Token;
  right: Expr;

  constructor(operator: Token, right: Expr) {
    this.operator = operator;
    this.right = right;
  }

  accept(visitor: VisitorExpr): Literal {
    return visitor.visitUnaryExpr(this);
  }
}

export class VariableExpr implements Expr {
  name: Token;

  constructor(name: Token) {
    this.name = name;
  }

  accept(visitor: VisitorExpr): Literal {
    return visitor.visitVariableExpr(this);
  }
}
