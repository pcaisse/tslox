import type Interpreter from "./interpreter";
import type { Literal } from "./types";

export default abstract class LoxCallable {
  abstract arity: () => number;
  abstract call: (interpreter: Interpreter, args: Literal[]) => Literal;
}

export class ClockCallable implements LoxCallable {
  arity() {
    return 0;
  }

  call(): number {
    return Date.now() / 1000;
  }
}
