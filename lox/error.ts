import Token from "./token.ts";

export class RuntimeError extends Error {
  token: Token;

  constructor(message: string, token: Token) {
    super(message);
    this.token = token;
  }
}
