import { readFile } from "node:fs/promises";

import type { RuntimeError } from "./error.ts";
import Interpreter from "./interpreter.ts";
import Parser from "./parser.ts";
import Resolver from "./resolver.ts";
import Scanner from "./scanner.ts";

export default class Lox {
  interpreter = new Interpreter(this.#runtimeError);
  hadError = false;
  hadRuntimeError = false;

  constructor(args: string[]) {
    if (args.length > 3) {
      console.log("Usage: tslox [script]");
      process.exit(64);
    } else if (args[2]) {
      this.#runFile(args[2]);
    } else {
      this.#runPrompt();
    }
  }

  async #runFile(path: string) {
    const text = await readFile(path, "utf8");
    this.#run(text);

    // Indicate an error in the exit code.
    if (this.hadError) process.exit(65);
    if (this.hadRuntimeError) process.exit(70);
  }

  async #runPrompt() {
    process.stdin.setEncoding("utf8");
    process.stdout.write("> ");
    for await (const input of process.stdin) {
      this.#run(input);
      process.stdout.write("> ");
    }
  }

  #run(source: string): void {
    const scanner = new Scanner(source, this.#error);
    if (this.hadError) return;

    const tokens = scanner.scanTokens();
    const parser = new Parser(tokens, this.#error);
    const statements = parser.parse();
    if (this.hadError) return;

    const resolver = new Resolver(this.interpreter, this.#error);
    if (this.hadError) return;

    resolver.resolve(statements);
    this.interpreter.interpret(statements);
  }

  #error(line: number, where: string, message: string): void {
    console.error("[line " + line + "] Error" + where + ": " + message);
    this.hadError = true;
  }

  #runtimeError(error: RuntimeError) {
    console.error(error.message + "\n[line " + error.token.line + "]");
    this.hadRuntimeError = true;
  }
}
