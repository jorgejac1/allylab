import { writeFileSync } from 'fs';
import { resolve } from 'path';

export function writeOutput(filename: string, content: string): void {
  const filepath = resolve(process.cwd(), filename);
  writeFileSync(filepath, content, 'utf-8');
}