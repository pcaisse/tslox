import Token from "./token";
import {
  AssignExpr,
  BinaryExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
  VariableExpr,
} from "./expr";
import { TokenType } from "./tokenType";
import {
  BlockStmt,
  ExprStmt,
  IfStmt,
  PrintStmt,
  VarStmt,
  type Stmt,
} from "./stmt";

export class ParseError extends Error {
  token: Token;
  constructor(message: string, token: Token) {
    super(message);
    this.name = "ParseError";
    this.token = token;
  }
}

export default class Parser {
  tokens: Token[];
  #report: (line: number, where: string, message: string) => void;
  #current: number = 0;

  constructor(
    tokens: Token[],
    report: (line: number, where: string, message: string) => void,
  ) {
    this.tokens = tokens;
    this.#report = report;
  }

  parse(): Stmt[] {
    let statements: Stmt[] = [];
    while (!this.#isAtEnd()) {
      statements.push(this.#declaration());
    }
    return statements;
  }

  #expression(): Expr {
    return this.#assignment();
  }

  #declaration(): Stmt {
    try {
      if (this.#match(TokenType.VAR)) return this.#varDeclaration();
      return this.#statement();
    } catch (error) {
      if (error instanceof ParseError) this.#synchronize();
      throw error;
    }
  }

  #statement(): Stmt {
    if (this.#match(TokenType.IF)) return this.#ifStatement();
    if (this.#match(TokenType.PRINT)) return this.#printStatement();
    if (this.#match(TokenType.LEFT_BRACE)) return new BlockStmt(this.#block());
    return this.#expressionStatement();
  }

  #ifStatement(): Stmt {
    this.#consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
    const condition = this.#expression();
    this.#consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition.");

    const thenBranch = this.#statement();
    const elseBranch = this.#match(TokenType.ELSE) ? this.#statement() : null;

    return new IfStmt(condition, thenBranch, elseBranch);
  }

  #printStatement(): PrintStmt {
    const value: Expr = this.#expression();
    this.#consume(TokenType.SEMICOLON, "Expect ';' after value.");
    return new PrintStmt(value);
  }

  #varDeclaration(): VarStmt {
    const name: Token = this.#consume(
      TokenType.IDENTIFIER,
      "Expect variable name.",
    );
    const initializer = this.#match(TokenType.EQUAL)
      ? this.#expression()
      : null;

    this.#consume(TokenType.SEMICOLON, "Expect ';' after variable declaration");
    return new VarStmt(name, initializer);
  }

  #expressionStatement(): ExprStmt {
    const expression: Expr = this.#expression();
    this.#consume(TokenType.SEMICOLON, "Expect ';' after expression.");
    return new ExprStmt(expression);
  }

  #block(): Stmt[] {
    const statements: Stmt[] = [];
    while (!this.#check(TokenType.RIGHT_BRACE) && !this.#isAtEnd()) {
      statements.push(this.#declaration());
    }
    this.#consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");
    return statements;
  }

  #assignment(): Expr {
    const expr = this.#equality();

    if (this.#match(TokenType.EQUAL)) {
      const equals = this.#previous();
      const value = this.#assignment();

      if (expr instanceof VariableExpr) {
        const name = expr.name;
        return new AssignExpr(name, value);
      }

      this.#error(equals, "Invalid assignment target.");
    }

    return expr;
  }

  #equality(): Expr {
    let expr: Expr = this.#comparison();

    while (this.#match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator: Token = this.#previous();
      const right: Expr = this.#comparison();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  #comparison(): Expr {
    let expr: Expr = this.#term();

    while (
      this.#match(
        TokenType.GREATER,
        TokenType.GREATER_EQUAL,
        TokenType.LESS,
        TokenType.LESS_EQUAL,
      )
    ) {
      const operator: Token = this.#previous();
      const right: Expr = this.#term();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  #term(): Expr {
    let expr: Expr = this.#factor();

    while (this.#match(TokenType.MINUS, TokenType.PLUS)) {
      const operator: Token = this.#previous();
      const right: Expr = this.#factor();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  #factor(): Expr {
    let expr: Expr = this.#unary();

    while (this.#match(TokenType.SLASH, TokenType.STAR)) {
      const operator: Token = this.#previous();
      const right: Expr = this.#unary();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  #unary(): Expr {
    if (this.#match(TokenType.BANG, TokenType.MINUS)) {
      const operator: Token = this.#previous();
      const right: Expr = this.#unary();
      return new UnaryExpr(operator, right);
    }

    return this.#primary();
  }

  #primary(): Expr {
    if (this.#match(TokenType.FALSE)) return new LiteralExpr(false);
    if (this.#match(TokenType.TRUE)) return new LiteralExpr(true);
    if (this.#match(TokenType.NIL)) return new LiteralExpr(null);

    if (this.#match(TokenType.NUMBER, TokenType.STRING)) {
      return new LiteralExpr(this.#previous().literal);
    }

    if (this.#match(TokenType.IDENTIFIER)) {
      return new VariableExpr(this.#previous());
    }

    if (this.#match(TokenType.LEFT_PAREN)) {
      const expr: Expr = this.#expression();
      this.#consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
      return new GroupingExpr(expr);
    }

    throw this.#error(this.#peek(), "Expect expression.");
  }

  #match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.#check(type)) {
        this.#advance();
        return true;
      }
    }

    return false;
  }

  #consume(type: TokenType, message: string): Token {
    if (this.#check(type)) return this.#advance();
    const token = this.#peek();
    this.#error(token, message);
  }

  #error(token: Token, message: string): never {
    this.#report(
      token.line,
      token.type === TokenType.EOF ? " at end" : " at '" + token.lexeme + "'",
      message,
    );
    throw new ParseError(message, token);
  }

  #synchronize(): void {
    this.#advance();

    while (!this.#isAtEnd()) {
      if (this.#previous().type == TokenType.SEMICOLON) return;

      switch (this.#peek().type) {
        case TokenType.CLASS:
        case TokenType.FUN:
        case TokenType.VAR:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.PRINT:
        case TokenType.RETURN:
          return;
      }

      this.#advance();
    }
  }

  #check(type: TokenType): boolean {
    if (this.#isAtEnd()) return false;
    return this.#peek().type == type;
  }

  #advance(): Token {
    if (!this.#isAtEnd()) this.#current++;
    return this.#previous();
  }

  #isAtEnd(): boolean {
    return this.#peek().type === TokenType.EOF;
  }

  #peek(): Token {
    return this.tokens[this.#current] as Token;
  }

  #previous(): Token {
    return this.tokens[this.#current - 1] as Token;
  }
}
