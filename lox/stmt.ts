import type { Expr } from "./expr";
import type { Literal } from "./types";

export interface VisitorStmt {
  visitExprStmt: (stmt: ExprStmt) => Literal;
  visitPrintStmt: (stmt: PrintStmt) => Literal;
}

export abstract class Stmt {
  abstract accept: (visitor: VisitorStmt) => Literal;
}

export class ExprStmt implements Stmt {
  expression: Expr;

  constructor(expression: Expr) {
    this.expression = expression;
  }

  accept(visitor: VisitorStmt): Literal {
    return visitor.visitExprStmt(this);
  }
}

export class PrintStmt implements Stmt {
  expression: Expr;

  constructor(expression: Expr) {
    this.expression = expression;
  }

  accept(visitor: VisitorStmt): Literal {
    return visitor.visitPrintStmt(this);
  }
}
