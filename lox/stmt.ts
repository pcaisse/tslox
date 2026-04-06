import Token from "./token";
import type { Expr } from "./expr";

export interface VisitorStmt {
  visitExprStmt: (stmt: ExprStmt) => void;
  visitPrintStmt: (stmt: PrintStmt) => void;
  visitVarStmt: (stmt: VarStmt) => void;
  visitBlockStmt: (stmt: BlockStmt) => void;
  visitIfStmt: (stmt: IfStmt) => void;
  visitWhileStmt: (stmt: WhileStmt) => void;
  visitFunctionStmt: (stmt: FunctionStmt) => void;
  visitReturnStmt: (stmt: ReturnStmt) => void;
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

export class WhileStmt implements Stmt {
  condition: Expr;
  body: Stmt;

  constructor(condition: Expr, body: Stmt) {
    this.condition = condition;
    this.body = body;
  }

  accept(visitor: VisitorStmt): void {
    return visitor.visitWhileStmt(this);
  }
}

export class FunctionStmt implements Stmt {
  name: Token;
  params: Token[];
  body: Stmt[];

  constructor(name: Token, params: Token[], body: Stmt[]) {
    this.name = name;
    this.params = params;
    this.body = body;
  }

  accept(visitor: VisitorStmt): void {
    return visitor.visitFunctionStmt(this);
  }
}

export class ReturnStmt implements Stmt {
  keyword: Token;
  value: Expr | null;

  constructor(keyword: Token, value: Expr | null) {
    this.keyword = keyword;
    this.value = value;
  }

  accept(visitor: VisitorStmt): void {
    return visitor.visitReturnStmt(this);
  }
}
