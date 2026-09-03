import Token from "./token.ts";
import { TOKEN_TYPE } from "./tokenType.ts";
import type { TokenType } from "./tokenType.ts";

export default class Scanner {
  #source: string;
  #report: (line: number, where: string, message: string) => void;
  #tokens: Token[] = [];
  #start = 0;
  #current = 0;
  #line = 1;

  #keywords: Map<keyof typeof TOKEN_TYPE, TokenType> = new Map([
    ["AND", TOKEN_TYPE.AND],
    ["ELSE", TOKEN_TYPE.ELSE],
    ["FALSE", TOKEN_TYPE.FALSE],
    ["FOR", TOKEN_TYPE.FOR],
    ["FUN", TOKEN_TYPE.FUN],
    ["IF", TOKEN_TYPE.IF],
    ["NIL", TOKEN_TYPE.NIL],
    ["OR", TOKEN_TYPE.OR],
    ["PRINT", TOKEN_TYPE.PRINT],
    ["RETURN", TOKEN_TYPE.RETURN],
    ["TRUE", TOKEN_TYPE.TRUE],
    ["VAR", TOKEN_TYPE.VAR],
    ["WHILE", TOKEN_TYPE.WHILE],
  ]);

  constructor(
    source: string,
    report: (line: number, where: string, message: string) => void,
  ) {
    this.#source = source;
    this.#report = report;
  }

  scanTokens(): Token[] {
    while (!this.#isAtEnd()) {
      // We are at the beginning of the next lexeme.
      this.#start = this.#current;
      this.#scanToken();
    }

    this.#tokens.push(new Token(TOKEN_TYPE.EOF, "", null, this.#line));
    return this.#tokens;
  }

  #scanToken(): void {
    const c = this.#advance();
    switch (c) {
      case "(":
        this.#addToken(TOKEN_TYPE.LEFT_PAREN);
        break;
      case ")":
        this.#addToken(TOKEN_TYPE.RIGHT_PAREN);
        break;
      case "{":
        this.#addToken(TOKEN_TYPE.LEFT_BRACE);
        break;
      case "}":
        this.#addToken(TOKEN_TYPE.RIGHT_BRACE);
        break;
      case ",":
        this.#addToken(TOKEN_TYPE.COMMA);
        break;
      case ".":
        this.#addToken(TOKEN_TYPE.DOT);
        break;
      case "-":
        this.#addToken(TOKEN_TYPE.MINUS);
        break;
      case "+":
        this.#addToken(TOKEN_TYPE.PLUS);
        break;
      case ";":
        this.#addToken(TOKEN_TYPE.SEMICOLON);
        break;
      case "*":
        this.#addToken(TOKEN_TYPE.STAR);
        break;
      case "!":
        this.#addToken(
          this.#match("=") ? TOKEN_TYPE.BANG_EQUAL : TOKEN_TYPE.BANG,
        );
        break;
      case "=":
        this.#addToken(
          this.#match("=") ? TOKEN_TYPE.EQUAL_EQUAL : TOKEN_TYPE.EQUAL,
        );
        break;
      case "<":
        this.#addToken(
          this.#match("=") ? TOKEN_TYPE.LESS_EQUAL : TOKEN_TYPE.LESS,
        );
        break;
      case ">":
        this.#addToken(
          this.#match("=") ? TOKEN_TYPE.GREATER_EQUAL : TOKEN_TYPE.GREATER,
        );
        break;
      case "/":
        if (this.#match("/")) {
          // A comment goes until the end of the line.
          while (this.#peek() != "\n" && !this.#isAtEnd()) this.#advance();
        } else {
          this.#addToken(TOKEN_TYPE.SLASH);
        }
        break;
      case " ":
      case "\r":
      case "\t":
        // Ignore whitespace.
        break;

      case "\n":
        this.#line++;
        break;
      case '"':
        this.#string();
        break;
      default:
        if (this.#isDigit(c)) {
          this.#number();
        } else if (this.#isAlpha(c)) {
          this.#identifier();
        } else {
          this.#report(this.#line, "", "Unexpected character.");
        }
        break;
    }
  }

  #identifier(): void {
    while (this.#isAlphaNumeric(this.#peek())) this.#advance();

    const text = this.#source
      .substring(this.#start, this.#current)
      .toUpperCase();
    let type = this.#keywords.get(text as keyof typeof TOKEN_TYPE);
    if (type === undefined) type = TOKEN_TYPE.IDENTIFIER;
    this.#addToken(type);
  }

  #number(): void {
    while (this.#isDigit(this.#peek())) this.#advance();

    // Look for a fractional part.
    if (this.#peek() === "." && this.#isDigit(this.#peekNext())) {
      // Consume the "."
      this.#advance();

      while (this.#isDigit(this.#peek())) this.#advance();
    }

    this.#addToken(
      TOKEN_TYPE.NUMBER,
      parseFloat(this.#source.substring(this.#start, this.#current)),
    );
  }

  #string(): void {
    while (this.#peek() != '"' && !this.#isAtEnd()) {
      if (this.#peek() === "\n") this.#line++;
      this.#advance();
    }

    if (this.#isAtEnd()) {
      this.#report(this.#line, "", "Unterminated string.");
      return;
    }

    // The closing ".
    this.#advance();

    // Trim the surrounding quotes.
    const value = this.#source.substring(this.#start + 1, this.#current - 1);
    this.#addToken(TOKEN_TYPE.STRING, value);
  }

  #match(expected: string) {
    if (this.#isAtEnd()) return false;
    if (this.#source.charAt(this.#current) !== expected) return false;

    this.#current++;
    return true;
  }

  #peek() {
    if (this.#isAtEnd()) return "\0";
    return this.#source.charAt(this.#current);
  }

  #peekNext() {
    if (this.#current + 1 >= this.#source.length) return "\0";
    return this.#source.charAt(this.#current + 1);
  }

  #isAlpha(c: string) {
    return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_";
  }

  #isAlphaNumeric(c: string) {
    return this.#isAlpha(c) || this.#isDigit(c);
  }

  #isDigit(c: string) {
    return c >= "0" && c <= "9";
  }

  #isAtEnd() {
    return this.#current >= this.#source.length;
  }

  #advance() {
    return this.#source.charAt(this.#current++);
  }

  #addToken(type: TokenType, literal: string | number | null = null) {
    const text: string = this.#source.substring(this.#start, this.#current);
    this.#tokens.push(new Token(type, text, literal, this.#line));
  }
}
