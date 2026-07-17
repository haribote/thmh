# Test-Driven Development (t-wada style)

This project follows the classic, strict TDD cycle advocated by Takuto Wada (t_wada). The point is not to "write a lot of tests up front" — it is to repeat the steps below rigorously, one feature at a time.

## The cycle (always in this order)

1. **Build a test list.**
   - Before writing any implementation, enumerate the behaviors you want and list candidate test cases (a TODO list).
   - Present this list to the user and align on it before proceeding.

2. **Red: write exactly one failing test.**
   - Pick a single item from the test list and write concrete, runnable test code.
   - Do not write any implementation code.
   - Run the test and confirm it fails **as intended** — check the reason (a compile error or an assertion failure).
   - Do not move on before you have seen the failure.

3. **Green: write the minimum code to pass.**
   - Write the minimum code that makes the new test — and every existing test — pass.
   - Do not worry about elegance here; hard-coding or a fake implementation (fake it) is fine.
   - Do not add anything beyond what the test demands (no over-implementation).
   - Add any new test cases you notice to the test list.

4. **Refactor: improve the design while staying green.**
   - With all tests passing, remove duplication, improve names, and tidy the structure.
   - Re-run the tests after each refactoring; stay green at all times.
   - Do not mix new behavior or spec changes into this step.

5. **Repeat steps 2–4 until the test list is empty.**

## Non-negotiable rules

- **Never write more than one test at a time.** One cycle equals one test case.
- **Never write production code before you have seen the Red.**
- **Never rewrite or delete a test just to make it pass.**
- At the end of each step, briefly report what you did — which of Red / Green / Refactor, and the result.
- A "tests pass" report must be based on actually running the test command. Never report success from a guess without running it.

## Commands

- Run all tests: `pnpm test`
- Run a single test by name: `pnpm --filter <package> test -- -t "<test name>"` — e.g. `pnpm --filter @thmh/core test -- -t "cva"`.
- Run a single test file: `pnpm --filter <package> test -- <path/to/file.test.ts>`.

Tests run on vitest. Add fixture-based tests under `packages/*/test/`.

## Reference

This style follows Kent Beck's classic definition of TDD, as presented by Takuto Wada (@t_wada).
