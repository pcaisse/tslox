import Interpreter, { RuntimeError } from "./interpreter";
import Parser from "./parser";
import Scanner from "./scanner";

export default class Lox {
  interpreter = new Interpreter(this.#runtimeError);
  hadError = false;
  hadRuntimeError = false;

  constructor() {
    if (arguments.length > 1) {
      console.log("Usage: tslox [script]");
      process.exit(64);
    } else if (arguments.length === 1) {
      this.#runFile(arguments[0]);
    } else {
      this.#runPrompt();
    }
  }

  async #runFile(path: string) {
    const file = Bun.file(path);
    const text = await file.text();
    this.#run(text);

    // Indicate an error in the exit code.
    if (this.hadError) process.exit(65);
    if (this.hadRuntimeError) process.exit(70);
  }

  async #runPrompt() {
    Bun.stdout.write("> ");
    for await (const input of console) {
      this.#run(input);
      Bun.stdout.write("> ");
    }
  }

  #run(source: string): void {
    const scanner = new Scanner(source, this.#error);
    const tokens = scanner.scanTokens();
    const parser = new Parser(tokens, this.#error);
    const statements = parser.parse();
    if (this.hadError) return;
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
