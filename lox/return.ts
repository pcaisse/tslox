import type { Literal } from "./types.ts";

export default class Return extends Error {
  value: Literal;

  constructor(value: Literal) {
    super("value");
    this.value = value;
  }
}
