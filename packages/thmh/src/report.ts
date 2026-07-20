export function reportWarnings(
  warnings: readonly string[],
  write: (chunk: string) => void,
): void {
  for (const warning of warnings) {
    write(`${warning}\n`);
  }
}
