import Token from "./token";

export class RuntimeError extends Error {
  token: Token;

  constructor(message: string, token: Token) {
    super(message);
    this.token = token;
  }
}
