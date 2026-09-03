import Token from "./token.ts";
import {
  AssignExpr,
  BinaryExpr,
  CallExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  LogicalExpr,
  UnaryExpr,
  VariableExpr,
} from "./expr.ts";
import { TOKEN_TYPE, type TokenType } from "./tokenType.ts";
import {
  BlockStmt,
  ExprStmt,
  FunctionStmt,
  IfStmt,
  PrintStmt,
  ReturnStmt,
  VarStmt,
  WhileStmt,
  type Stmt,
} from "./stmt.ts";

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
      if (this.#match(TOKEN_TYPE.FUN)) return this.#function("function");
      if (this.#match(TOKEN_TYPE.VAR)) return this.#varDeclaration();
      return this.#statement();
    } catch (error) {
      if (error instanceof ParseError) this.#synchronize();
      throw error;
    }
  }

  #statement(): Stmt {
    if (this.#match(TOKEN_TYPE.IF)) return this.#ifStatement();
    if (this.#match(TOKEN_TYPE.FOR)) return this.#forStatement();
    if (this.#match(TOKEN_TYPE.PRINT)) return this.#printStatement();
    if (this.#match(TOKEN_TYPE.RETURN)) return this.#returnStatement();
    if (this.#match(TOKEN_TYPE.WHILE)) return this.#whileStatement();
    if (this.#match(TOKEN_TYPE.LEFT_BRACE)) return new BlockStmt(this.#block());
    return this.#expressionStatement();
  }

  #forStatement(): Stmt {
    this.#consume(TOKEN_TYPE.LEFT_PAREN, "Expect '(' after 'for'.");

    let initializer: Stmt | null;
    if (this.#match(TOKEN_TYPE.SEMICOLON)) {
      initializer = null;
    } else if (this.#match(TOKEN_TYPE.VAR)) {
      initializer = this.#varDeclaration();
    } else {
      initializer = this.#expressionStatement();
    }

    const condition = !this.#check(TOKEN_TYPE.SEMICOLON)
      ? this.#expression()
      : null;
    this.#consume(TOKEN_TYPE.SEMICOLON, "Expect ';' after loop condition.");

    const increment = !this.#check(TOKEN_TYPE.RIGHT_PAREN)
      ? this.#expression()
      : null;
    this.#consume(TOKEN_TYPE.RIGHT_PAREN, "Expect ')' after 'for'.");

    const body = this.#statement();

    const bodyWithIncrement =
      increment !== null
        ? new BlockStmt([body, new ExprStmt(increment)])
        : // default increment is no-op
          body;

    const whileStatement = new WhileStmt(
      // default condition is true
      condition || new LiteralExpr(true),
      bodyWithIncrement,
    );

    const finalBody =
      initializer !== null
        ? new BlockStmt([initializer, whileStatement])
        : // default initializer is no-op
          whileStatement;

    return finalBody;
  }

  #ifStatement(): Stmt {
    this.#consume(TOKEN_TYPE.LEFT_PAREN, "Expect '(' after 'if'.");
    const condition = this.#expression();
    this.#consume(TOKEN_TYPE.RIGHT_PAREN, "Expect ')' after if condition.");

    const thenBranch = this.#statement();
    const elseBranch = this.#match(TOKEN_TYPE.ELSE) ? this.#statement() : null;

    return new IfStmt(condition, thenBranch, elseBranch);
  }

  #printStatement(): PrintStmt {
    const value: Expr = this.#expression();
    this.#consume(TOKEN_TYPE.SEMICOLON, "Expect ';' after value.");
    return new PrintStmt(value);
  }

  #returnStatement(): ReturnStmt {
    const keyword: Token = this.#previous();
    const value = !this.#check(TOKEN_TYPE.SEMICOLON)
      ? this.#expression()
      : null;
    this.#consume(TOKEN_TYPE.SEMICOLON, "Expect ';' after return value.");
    return new ReturnStmt(keyword, value);
  }

  #varDeclaration(): VarStmt {
    const name: Token = this.#consume(
      TOKEN_TYPE.IDENTIFIER,
      "Expect variable name.",
    );
    const initializer = this.#match(TOKEN_TYPE.EQUAL)
      ? this.#expression()
      : null;

    this.#consume(
      TOKEN_TYPE.SEMICOLON,
      "Expect ';' after variable declaration",
    );
    return new VarStmt(name, initializer);
  }

  #whileStatement(): WhileStmt {
    this.#consume(TOKEN_TYPE.LEFT_PAREN, "Expect '(' after 'while'.");
    const condition = this.#expression();
    this.#consume(TOKEN_TYPE.RIGHT_PAREN, "Expect ')' after 'while'.");
    const body = this.#statement();
    return new WhileStmt(condition, body);
  }

  #expressionStatement(): ExprStmt {
    const expression: Expr = this.#expression();
    this.#consume(TOKEN_TYPE.SEMICOLON, "Expect ';' after expression.");
    return new ExprStmt(expression);
  }

  #function(kind: string): FunctionStmt {
    const name = this.#consume(
      TOKEN_TYPE.IDENTIFIER,
      "Expect " + kind + " name.",
    );
    this.#consume(TOKEN_TYPE.LEFT_PAREN, "Expect '(' after " + kind + " name.");
    const parameters = [];
    if (!this.#check(TOKEN_TYPE.RIGHT_PAREN)) {
      do {
        if (parameters.length >= 255) {
          this.#error(this.#peek(), "Can't have more than 255 parameters.");
        }

        parameters.push(
          this.#consume(TOKEN_TYPE.IDENTIFIER, "Expect parameter name."),
        );
      } while (this.#match(TOKEN_TYPE.COMMA));
    }
    this.#consume(TOKEN_TYPE.RIGHT_PAREN, "Expect ')' after parameters.");

    this.#consume(
      TOKEN_TYPE.LEFT_BRACE,
      "Expect '{' before " + kind + " body.",
    );
    const body = this.#block();
    return new FunctionStmt(name, parameters, body);
  }

  #block(): Stmt[] {
    const statements: Stmt[] = [];
    while (!this.#check(TOKEN_TYPE.RIGHT_BRACE) && !this.#isAtEnd()) {
      statements.push(this.#declaration());
    }
    this.#consume(TOKEN_TYPE.RIGHT_BRACE, "Expect '}' after block.");
    return statements;
  }

  #assignment(): Expr {
    const expr = this.#or();

    if (this.#match(TOKEN_TYPE.EQUAL)) {
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

  #or(): Expr {
    let expr = this.#and();

    while (this.#match(TOKEN_TYPE.OR)) {
      const operator = this.#previous();
      const right = this.#and();
      expr = new LogicalExpr(expr, operator, right);
    }

    return expr;
  }

  #and(): Expr {
    let expr = this.#equality();

    while (this.#match(TOKEN_TYPE.AND)) {
      const operator = this.#previous();
      const right = this.#equality();
      expr = new LogicalExpr(expr, operator, right);
    }

    return expr;
  }

  #equality(): Expr {
    let expr: Expr = this.#comparison();

    while (this.#match(TOKEN_TYPE.BANG_EQUAL, TOKEN_TYPE.EQUAL_EQUAL)) {
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
        TOKEN_TYPE.GREATER,
        TOKEN_TYPE.GREATER_EQUAL,
        TOKEN_TYPE.LESS,
        TOKEN_TYPE.LESS_EQUAL,
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

    while (this.#match(TOKEN_TYPE.MINUS, TOKEN_TYPE.PLUS)) {
      const operator: Token = this.#previous();
      const right: Expr = this.#factor();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  #factor(): Expr {
    let expr: Expr = this.#unary();

    while (this.#match(TOKEN_TYPE.SLASH, TOKEN_TYPE.STAR)) {
      const operator: Token = this.#previous();
      const right: Expr = this.#unary();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  #unary(): Expr {
    if (this.#match(TOKEN_TYPE.BANG, TOKEN_TYPE.MINUS)) {
      const operator: Token = this.#previous();
      const right: Expr = this.#unary();
      return new UnaryExpr(operator, right);
    }

    return this.#call();
  }

  #finishCall(callee: Expr) {
    const args: Expr[] = [];
    if (!this.#check(TOKEN_TYPE.RIGHT_PAREN)) {
      do {
        if (args.length >= 255) {
          this.#error(this.#peek(), "Can't have more than 255 arguments.");
        }
        args.push(this.#expression());
      } while (this.#match(TOKEN_TYPE.COMMA));
    }

    const paren = this.#consume(
      TOKEN_TYPE.RIGHT_PAREN,
      "Expect ')' after arguments.",
    );

    return new CallExpr(callee, paren, args);
  }

  #call(): Expr {
    let expr = this.#primary();

    while (true) {
      if (this.#match(TOKEN_TYPE.LEFT_PAREN)) {
        expr = this.#finishCall(expr);
      } else {
        break;
      }
    }

    return expr;
  }

  #primary(): Expr {
    if (this.#match(TOKEN_TYPE.FALSE)) return new LiteralExpr(false);
    if (this.#match(TOKEN_TYPE.TRUE)) return new LiteralExpr(true);
    if (this.#match(TOKEN_TYPE.NIL)) return new LiteralExpr(null);

    if (this.#match(TOKEN_TYPE.NUMBER, TOKEN_TYPE.STRING)) {
      return new LiteralExpr(this.#previous().literal);
    }

    if (this.#match(TOKEN_TYPE.IDENTIFIER)) {
      return new VariableExpr(this.#previous());
    }

    if (this.#match(TOKEN_TYPE.LEFT_PAREN)) {
      const expr: Expr = this.#expression();
      this.#consume(TOKEN_TYPE.RIGHT_PAREN, "Expect ')' after expression.");
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
      token.type === TOKEN_TYPE.EOF ? " at end" : " at '" + token.lexeme + "'",
      message,
    );
    throw new ParseError(message, token);
  }

  #synchronize(): void {
    this.#advance();

    while (!this.#isAtEnd()) {
      if (this.#previous().type == TOKEN_TYPE.SEMICOLON) return;

      switch (this.#peek().type) {
        case TOKEN_TYPE.FUN:
        case TOKEN_TYPE.VAR:
        case TOKEN_TYPE.FOR:
        case TOKEN_TYPE.IF:
        case TOKEN_TYPE.WHILE:
        case TOKEN_TYPE.PRINT:
        case TOKEN_TYPE.RETURN:
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
    return this.#peek().type === TOKEN_TYPE.EOF;
  }

  #peek(): Token {
    return this.tokens[this.#current] as Token;
  }

  #previous(): Token {
    return this.tokens[this.#current - 1] as Token;
  }
}
