import Token from "./token";
import type { Expr } from "./expr";

export interface VisitorStmt {
  visitExprStmt: (stmt: ExprStmt) => void;
  visitPrintStmt: (stmt: PrintStmt) => void;
  visitVarStmt: (stmt: VarStmt) => void;
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

export class VarStmt implements Stmt {
  name: Token;
  initializer: Expr | null;

  constructor(name: Token, initializer: Expr | null) {
    this.name = name;
    this.initializer = initializer;
  }

  accept(visitor: VisitorStmt): void {
    return visitor.visitVarStmt(this);
  }
}
