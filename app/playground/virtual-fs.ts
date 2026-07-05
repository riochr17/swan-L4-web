export namespace VirtualFS {
  const files: Record<string, string> = {};

  export function readFile(filename: string): string {
    if (!files[filename]) {
      files[filename] = '';
    }

    return files[filename];
  }

  export function writeFile(filename: string, content: string) {
    if (!files[filename]) {
      files[filename] = '';
    }

    files[filename] = content;
  }
}
