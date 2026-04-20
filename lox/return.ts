import type { Literal } from "./types";

export default class Return extends Error {
  value: Literal;

  constructor(value: Literal) {
    super("value");
    this.value = value;
  }
}
