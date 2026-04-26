# tslox

Partial TypeScript implementation of Lox from [Crafting Interpreters](https://craftinginterpreters.com/contents.html).

The core language is implemented but classes and inheritance (ch. 12 & 13) are skipped.

## Usage

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.1. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

## Examples

To run examples, do `bun run index.ts <path_to_example_file>` like so:
```
$ bun run index.ts examples/counter.lox
1
2
```
