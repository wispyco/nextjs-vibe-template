import { writeFile, readFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { applyPatch } from 'rfc6902';

const execAsync = promisify(exec);

export async function writeFs(path: string, content: string) {
  const dir = dirname(path);
  await mkdir(dir, { recursive: true });
  await writeFile(path, content, 'utf-8');
  return { success: true, path };
}

export async function applyPatchToFile(path: string, patch: any[]) {
  try {
    const content = await readFile(path, 'utf-8');
    const document = JSON.parse(content);
    applyPatch(document, patch);
    await writeFile(path, JSON.stringify(document, null, 2), 'utf-8');
    return { success: true, path };
  } catch (error) {
    // For non-JSON files, we'll need a different patching strategy
    throw new Error(`Patch failed for ${path}: ${error}`);
  }
}

export async function shell(cmd: string) {
  try {
    const { stdout, stderr } = await execAsync(cmd, { maxBuffer: 1024 * 1024 * 10 });
    return { success: true, stdout, stderr };
  } catch (error: any) {
    return { success: false, error: error.message, stdout: error.stdout, stderr: error.stderr };
  }
}

export async function gitCommit(message: string) {
  try {
    await execAsync('git add -A');
    await execAsync(`git commit -m "${message}"`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function gitPush() {
  try {
    await execAsync('git push');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}