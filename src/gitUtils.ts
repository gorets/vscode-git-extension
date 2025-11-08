import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import { promisify } from 'util';

const execFile = promisify(cp.execFile);

export interface GitExecutionResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}

/**
 * Execute a git command in the specified directory
 */
export async function executeGit(
    args: string[],
    cwd: string,
    options: { input?: string } = {}
): Promise<GitExecutionResult> {
    try {
        const gitPath = vscode.workspace.getConfiguration('git').get<string>('path') || 'git';

        const result = await execFile(gitPath, args, {
            cwd,
            maxBuffer: 10 * 1024 * 1024, // 10MB
            encoding: 'utf8',
            ...(options.input && { input: options.input })
        });

        return {
            stdout: result.stdout,
            stderr: result.stderr || '',
            exitCode: 0
        };
    } catch (error: any) {
        return {
            stdout: error.stdout || '',
            stderr: error.stderr || error.message || '',
            exitCode: error.code || 1
        };
    }
}

/**
 * Get the git repository root for a given path
 */
export async function getGitRoot(filePath: string): Promise<string | undefined> {
    const dir = path.dirname(filePath);
    const result = await executeGit(['rev-parse', '--show-toplevel'], dir);

    if (result.exitCode === 0) {
        return result.stdout.trim();
    }

    return undefined;
}

/**
 * Get relative path from git root
 */
export async function getRelativePath(filePath: string): Promise<string | undefined> {
    const gitRoot = await getGitRoot(filePath);
    if (!gitRoot) {
        return undefined;
    }

    return path.relative(gitRoot, filePath);
}

/**
 * Check if a file has uncommitted changes
 */
export async function hasUncommittedChanges(filePath: string): Promise<boolean> {
    const gitRoot = await getGitRoot(filePath);
    if (!gitRoot) {
        return false;
    }

    const relativePath = await getRelativePath(filePath);
    if (!relativePath) {
        return false;
    }

    const result = await executeGit(['status', '--porcelain', '--', relativePath], gitRoot);
    return result.stdout.trim().length > 0;
}

/**
 * Get all branches
 */
export async function getBranches(gitRoot: string): Promise<string[]> {
    const result = await executeGit(['branch', '-a'], gitRoot);

    if (result.exitCode !== 0) {
        return [];
    }

    return result.stdout
        .split('\n')
        .map(line => line.trim().replace(/^\*\s+/, ''))
        .filter(line => line.length > 0);
}

/**
 * Get all tags
 */
export async function getTags(gitRoot: string): Promise<string[]> {
    const result = await executeGit(['tag', '-l'], gitRoot);

    if (result.exitCode !== 0) {
        return [];
    }

    return result.stdout
        .split('\n')
        .filter(line => line.trim().length > 0);
}

/**
 * Get current branch name
 */
export async function getCurrentBranch(gitRoot: string): Promise<string | undefined> {
    const result = await executeGit(['rev-parse', '--abbrev-ref', 'HEAD'], gitRoot);

    if (result.exitCode === 0) {
        return result.stdout.trim();
    }

    return undefined;
}

/**
 * Get file status
 */
export async function getFileStatus(filePath: string): Promise<string | undefined> {
    const gitRoot = await getGitRoot(filePath);
    if (!gitRoot) {
        return undefined;
    }

    const relativePath = await getRelativePath(filePath);
    if (!relativePath) {
        return undefined;
    }

    const result = await executeGit(['status', '--porcelain', '--', relativePath], gitRoot);

    if (result.exitCode === 0 && result.stdout.trim().length > 0) {
        return result.stdout.trim().substring(0, 2);
    }

    return undefined;
}

/**
 * Get all remotes
 */
export async function getRemotes(gitRoot: string): Promise<string[]> {
    const result = await executeGit(['remote'], gitRoot);

    if (result.exitCode !== 0) {
        return [];
    }

    return result.stdout
        .split('\n')
        .filter(line => line.trim().length > 0);
}

/**
 * Get stash list
 */
export async function getStashList(gitRoot: string): Promise<string[]> {
    const result = await executeGit(['stash', 'list'], gitRoot);

    if (result.exitCode !== 0) {
        return [];
    }

    return result.stdout
        .split('\n')
        .filter(line => line.trim().length > 0);
}

/**
 * Check if path is inside a git repository
 */
export async function isInGitRepository(filePath: string): Promise<boolean> {
    const gitRoot = await getGitRoot(filePath);
    return gitRoot !== undefined;
}
