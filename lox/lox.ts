import Scanner, { ScannerError } from "./scanner";

export default class Lox {
  #hadError = false;

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
    if (this.#hadError) process.exit(65);
  }

  async #runPrompt() {
    console.log("> ");
    for await (const input of console) {
      this.#run(input);
    }
  }

  #run(source: string): void {
    const scanner = new Scanner(source);
    try {
      for (const token of scanner.scanTokens()) {
        console.log(token);
      }
    } catch (error) {
      if (error instanceof ScannerError) {
        this.#error(error.line, error.message);
      } else {
        throw error;
      }
    }
  }

  #error(line: number, message: string): void {
    this.#report(line, "", message);
  }

  #report(line: number, where: string, message: string): void {
    console.log("[line " + line + "] Error" + where + ": " + message);
    this.#hadError = true;
  }
}
