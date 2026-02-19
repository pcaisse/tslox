import Token from "./token";
import type { Expr } from "./expr";

export interface VisitorStmt {
  visitExprStmt: (stmt: ExprStmt) => void;
  visitPrintStmt: (stmt: PrintStmt) => void;
  visitVarStmt: (stmt: VarStmt) => void;
  visitBlockStmt: (stmt: BlockStmt) => void;
  visitIfStmt: (stmt: IfStmt) => void;
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

export class BlockStmt implements Stmt {
  statements: Stmt[];

  constructor(statements: Stmt[]) {
    this.statements = statements;
  }

  accept(visitor: VisitorStmt): void {
    return visitor.visitBlockStmt(this);
  }
}

export class IfStmt implements Stmt {
  condition: Expr;
  thenBranch: Stmt;
  elseBranch: Stmt | null;

  constructor(condition: Expr, thenBranch: Stmt, elseBranch: Stmt | null) {
    this.condition = condition;
    this.thenBranch = thenBranch;
    this.elseBranch = elseBranch;
  }

  accept(visitor: VisitorStmt): void {
    return visitor.visitIfStmt(this);
  }
}
