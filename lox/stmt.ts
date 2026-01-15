import type { Expr } from "./expr";

export interface VisitorStmt {
  visitExprStmt: (stmt: ExprStmt) => void;
  visitPrintStmt: (stmt: PrintStmt) => void;
}

export abstract class Stmt {
  abstract accept: (visitor: VisitorStmt) => void;
}

export class ExprStmt implements Stmt {
  expression: Expr;

  constructor(expression: Expr) {
    this.expression = expression;
  }

  accept(visitor: VisitorStmt): void {
    return visitor.visitExprStmt(this);
  }
}

export class PrintStmt implements Stmt {
  expression: Expr;

  constructor(expression: Expr) {
    this.expression = expression;
  }

  accept(visitor: VisitorStmt): void {
    return visitor.visitPrintStmt(this);
  }
}
