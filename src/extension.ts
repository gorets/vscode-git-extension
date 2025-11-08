import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {
    executeGit,
    getGitRoot,
    getRelativePath,
    hasUncommittedChanges,
    getBranches,
    getTags,
    getCurrentBranch,
    getFileStatus,
    getRemotes,
    getStashList,
    isInGitRepository
} from './gitUtils';

export function activate(context: vscode.ExtensionContext) {
    console.log('WebStorm Style Git extension is now active');

    // Register all commands
    context.subscriptions.push(
        vscode.commands.registerCommand('webstormGit.commitFile', commitFile),
        vscode.commands.registerCommand('webstormGit.commitDirectory', commitDirectory),
        vscode.commands.registerCommand('webstormGit.add', addToStaging),
        vscode.commands.registerCommand('webstormGit.addToGitignore', addToGitignore),
        vscode.commands.registerCommand('webstormGit.showDiff', showDiff),
        vscode.commands.registerCommand('webstormGit.compareWithRevision', compareWithRevision),
        vscode.commands.registerCommand('webstormGit.compareWithBranch', compareWithBranch),
        vscode.commands.registerCommand('webstormGit.showHistory', showHistory),
        vscode.commands.registerCommand('webstormGit.annotate', annotate),
        vscode.commands.registerCommand('webstormGit.rollback', rollback),
        vscode.commands.registerCommand('webstormGit.push', push),
        vscode.commands.registerCommand('webstormGit.pull', pull),
        vscode.commands.registerCommand('webstormGit.fetch', fetch),
        vscode.commands.registerCommand('webstormGit.merge', merge),
        vscode.commands.registerCommand('webstormGit.rebase', rebase),
        vscode.commands.registerCommand('webstormGit.branches', branches),
        vscode.commands.registerCommand('webstormGit.newBranch', newBranch),
        vscode.commands.registerCommand('webstormGit.newTag', newTag),
        vscode.commands.registerCommand('webstormGit.resetHead', resetHead),
        vscode.commands.registerCommand('webstormGit.stashChanges', stashChanges),
        vscode.commands.registerCommand('webstormGit.unstashChanges', unstashChanges),
        vscode.commands.registerCommand('webstormGit.manageRemotes', manageRemotes)
    );
}

export function deactivate() { }

/**
 * Get the file path from the command context
 */
function getFilePath(uri?: vscode.Uri): string | undefined {
    if (uri) {
        return uri.fsPath;
    }

    if (vscode.window.activeTextEditor) {
        return vscode.window.activeTextEditor.document.uri.fsPath;
    }

    return undefined;
}

/**
 * Commit a specific file
 */
async function commitFile(uri?: vscode.Uri) {
    const filePath = getFilePath(uri);
    if (!filePath) {
        vscode.window.showErrorMessage('No file selected');
        return;
    }

    if (!await isInGitRepository(filePath)) {
        vscode.window.showErrorMessage('File is not in a Git repository');
        return;
    }

    const gitRoot = await getGitRoot(filePath);
    if (!gitRoot) {
        return;
    }

    const relativePath = await getRelativePath(filePath);
    if (!relativePath) {
        return;
    }

    // First stage the file
    await executeGit(['add', relativePath], gitRoot);

    // Ask for commit message
    const message = await vscode.window.showInputBox({
        prompt: 'Commit message',
        placeHolder: 'Enter commit message'
    });

    if (!message) {
        return;
    }

    // Commit
    const result = await executeGit(['commit', '-m', message, '--', relativePath], gitRoot);

    if (result.exitCode === 0) {
        vscode.window.showInformationMessage('File committed successfully');
    } else {
        vscode.window.showErrorMessage(`Commit failed: ${result.stderr}`);
    }
}

/**
 * Commit a directory
 */
async function commitDirectory(uri?: vscode.Uri) {
    const dirPath = getFilePath(uri);
    if (!dirPath) {
        vscode.window.showErrorMessage('No directory selected');
        return;
    }

    if (!await isInGitRepository(dirPath)) {
        vscode.window.showErrorMessage('Directory is not in a Git repository');
        return;
    }

    const gitRoot = await getGitRoot(dirPath);
    if (!gitRoot) {
        return;
    }

    const relativePath = await getRelativePath(dirPath);
    if (!relativePath) {
        return;
    }

    // First stage the directory
    await executeGit(['add', relativePath], gitRoot);

    // Ask for commit message
    const message = await vscode.window.showInputBox({
        prompt: 'Commit message',
        placeHolder: 'Enter commit message'
    });

    if (!message) {
        return;
    }

    // Commit
    const result = await executeGit(['commit', '-m', message, '--', relativePath], gitRoot);

    if (result.exitCode === 0) {
        vscode.window.showInformationMessage('Directory committed successfully');
    } else {
        vscode.window.showErrorMessage(`Commit failed: ${result.stderr}`);
    }
}

/**
 * Add file/directory to staging
 */
async function addToStaging(uri?: vscode.Uri) {
    const filePath = getFilePath(uri);
    if (!filePath) {
        vscode.window.showErrorMessage('No file or directory selected');
        return;
    }

    if (!await isInGitRepository(filePath)) {
        vscode.window.showErrorMessage('Path is not in a Git repository');
        return;
    }

    const gitRoot = await getGitRoot(filePath);
    if (!gitRoot) {
        return;
    }

    const relativePath = await getRelativePath(filePath);
    if (!relativePath) {
        return;
    }

    const result = await executeGit(['add', relativePath], gitRoot);

    if (result.exitCode === 0) {
        vscode.window.showInformationMessage('Added to staging');
    } else {
        vscode.window.showErrorMessage(`Failed to add: ${result.stderr}`);
    }
}

/**
 * Add file/directory to .gitignore
 */
async function addToGitignore(uri?: vscode.Uri) {
    const filePath = getFilePath(uri);
    if (!filePath) {
        vscode.window.showErrorMessage('No file or directory selected');
        return;
    }

    const gitRoot = await getGitRoot(filePath);
    if (!gitRoot) {
        vscode.window.showErrorMessage('Path is not in a Git repository');
        return;
    }

    const relativePath = await getRelativePath(filePath);
    if (!relativePath) {
        return;
    }

    const gitignorePath = path.join(gitRoot, '.gitignore');

    try {
        let content = '';
        if (fs.existsSync(gitignorePath)) {
            content = fs.readFileSync(gitignorePath, 'utf8');
        }

        // Check if already in gitignore
        if (content.split('\n').some(line => line.trim() === relativePath)) {
            vscode.window.showInformationMessage('Already in .gitignore');
            return;
        }

        // Add to gitignore
        const newContent = content + (content.endsWith('\n') ? '' : '\n') + relativePath + '\n';
        fs.writeFileSync(gitignorePath, newContent);

        vscode.window.showInformationMessage('Added to .gitignore');
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to add to .gitignore: ${error}`);
    }
}

/**
 * Show diff for a file
 */
async function showDiff(uri?: vscode.Uri) {
    const filePath = getFilePath(uri);
    if (!filePath) {
        vscode.window.showErrorMessage('No file selected');
        return;
    }

    if (!await isInGitRepository(filePath)) {
        vscode.window.showErrorMessage('File is not in a Git repository');
        return;
    }

    // Use VSCode's built-in diff
    const fileUri = vscode.Uri.file(filePath);
    const gitUri = fileUri.with({ scheme: 'git', query: 'HEAD' });

    try {
        await vscode.commands.executeCommand('vscode.diff', gitUri, fileUri, `${path.basename(filePath)} (Working Tree)`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to show diff: ${error}`);
    }
}

/**
 * Compare with a specific revision
 */
async function compareWithRevision(uri?: vscode.Uri) {
    const filePath = getFilePath(uri);
    if (!filePath) {
        vscode.window.showErrorMessage('No file selected');
        return;
    }

    const gitRoot = await getGitRoot(filePath);
    if (!gitRoot) {
        vscode.window.showErrorMessage('File is not in a Git repository');
        return;
    }

    // Get commit hash
    const revision = await vscode.window.showInputBox({
        prompt: 'Enter revision (commit hash)',
        placeHolder: 'e.g., HEAD~1, abc123'
    });

    if (!revision) {
        return;
    }

    const fileUri = vscode.Uri.file(filePath);
    const gitUri = fileUri.with({ scheme: 'git', query: revision });

    try {
        await vscode.commands.executeCommand('vscode.diff', gitUri, fileUri, `${path.basename(filePath)} (${revision} ↔ Working Tree)`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to compare: ${error}`);
    }
}

/**
 * Compare with a branch or tag
 */
async function compareWithBranch(uri?: vscode.Uri) {
    const filePath = getFilePath(uri);
    if (!filePath) {
        vscode.window.showErrorMessage('No file selected');
        return;
    }

    const gitRoot = await getGitRoot(filePath);
    if (!gitRoot) {
        vscode.window.showErrorMessage('File is not in a Git repository');
        return;
    }

    // Get all branches and tags
    const branches = await getBranches(gitRoot);
    const tags = await getTags(gitRoot);
    const items = [...branches, ...tags];

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select branch or tag to compare with'
    });

    if (!selected) {
        return;
    }

    const fileUri = vscode.Uri.file(filePath);
    const gitUri = fileUri.with({ scheme: 'git', query: selected });

    try {
        await vscode.commands.executeCommand('vscode.diff', gitUri, fileUri, `${path.basename(filePath)} (${selected} ↔ Working Tree)`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to compare: ${error}`);
    }
}

/**
 * Show file/directory history
 */
async function showHistory(uri?: vscode.Uri) {
    const filePath = getFilePath(uri);
    if (!filePath) {
        vscode.window.showErrorMessage('No file or directory selected');
        return;
    }

    const gitRoot = await getGitRoot(filePath);
    if (!gitRoot) {
        vscode.window.showErrorMessage('Path is not in a Git repository');
        return;
    }

    const relativePath = await getRelativePath(filePath);
    if (!relativePath) {
        return;
    }

    // Get log
    const result = await executeGit(
        ['log', '--pretty=format:%h - %an, %ar : %s', '--', relativePath],
        gitRoot
    );

    if (result.exitCode !== 0) {
        vscode.window.showErrorMessage(`Failed to get history: ${result.stderr}`);
        return;
    }

    if (!result.stdout.trim()) {
        vscode.window.showInformationMessage('No commits found');
        return;
    }

    // Show in output channel
    const channel = vscode.window.createOutputChannel('Git History');
    channel.clear();
    channel.appendLine(`Git History: ${relativePath}`);
    channel.appendLine('='.repeat(80));
    channel.appendLine(result.stdout);
    channel.show();
}

/**
 * Annotate file with Git Blame
 */
async function annotate(uri?: vscode.Uri) {
    const filePath = getFilePath(uri);
    if (!filePath) {
        vscode.window.showErrorMessage('No file selected');
        return;
    }

    // Use VSCode's built-in Git blame (Toggle File Blame command)
    try {
        await vscode.commands.executeCommand('git.openFile', vscode.Uri.file(filePath));
        await vscode.commands.executeCommand('editor.action.showHover');
    } catch (error) {
        // Fallback: show blame in output channel
        const gitRoot = await getGitRoot(filePath);
        if (!gitRoot) {
            vscode.window.showErrorMessage('File is not in a Git repository');
            return;
        }

        const relativePath = await getRelativePath(filePath);
        if (!relativePath) {
            return;
        }

        const result = await executeGit(['blame', relativePath], gitRoot);

        if (result.exitCode !== 0) {
            vscode.window.showErrorMessage(`Failed to annotate: ${result.stderr}`);
            return;
        }

        const channel = vscode.window.createOutputChannel('Git Blame');
        channel.clear();
        channel.appendLine(`Git Blame: ${relativePath}`);
        channel.appendLine('='.repeat(80));
        channel.appendLine(result.stdout);
        channel.show();
    }
}

/**
 * Rollback changes
 */
async function rollback(uri?: vscode.Uri) {
    const filePath = getFilePath(uri);
    if (!filePath) {
        vscode.window.showErrorMessage('No file or directory selected');
        return;
    }

    const gitRoot = await getGitRoot(filePath);
    if (!gitRoot) {
        vscode.window.showErrorMessage('Path is not in a Git repository');
        return;
    }

    const relativePath = await getRelativePath(filePath);
    if (!relativePath) {
        return;
    }

    const confirm = await vscode.window.showWarningMessage(
        `Rollback changes in ${relativePath}? This cannot be undone.`,
        { modal: true },
        'Rollback'
    );

    if (confirm !== 'Rollback') {
        return;
    }

    const result = await executeGit(['checkout', 'HEAD', '--', relativePath], gitRoot);

    if (result.exitCode === 0) {
        vscode.window.showInformationMessage('Changes rolled back');
    } else {
        vscode.window.showErrorMessage(`Rollback failed: ${result.stderr}`);
    }
}

/**
 * Push to remote
 */
async function push(uri?: vscode.Uri) {
    const filePath = getFilePath(uri);
    const gitRoot = filePath ? await getGitRoot(filePath) : vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    if (!gitRoot) {
        vscode.window.showErrorMessage('Not in a Git repository');
        return;
    }

    const currentBranch = await getCurrentBranch(gitRoot);
    if (!currentBranch) {
        vscode.window.showErrorMessage('Could not determine current branch');
        return;
    }

    const remotes = await getRemotes(gitRoot);
    if (remotes.length === 0) {
        vscode.window.showErrorMessage('No remotes configured');
        return;
    }

    const remote = remotes.length === 1 ? remotes[0] : await vscode.window.showQuickPick(remotes, {
        placeHolder: 'Select remote to push to'
    });

    if (!remote) {
        return;
    }

    vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: `Pushing to ${remote}/${currentBranch}...`,
            cancellable: false
        },
        async () => {
            const result = await executeGit(['push', remote, currentBranch], gitRoot);

            if (result.exitCode === 0) {
                vscode.window.showInformationMessage('Push successful');
            } else {
                vscode.window.showErrorMessage(`Push failed: ${result.stderr}`);
            }
        }
    );
}

/**
 * Pull from remote
 */
async function pull(uri?: vscode.Uri) {
    const filePath = getFilePath(uri);
    const gitRoot = filePath ? await getGitRoot(filePath) : vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    if (!gitRoot) {
        vscode.window.showErrorMessage('Not in a Git repository');
        return;
    }

    vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: 'Pulling from remote...',
            cancellable: false
        },
        async () => {
            const result = await executeGit(['pull'], gitRoot);

            if (result.exitCode === 0) {
                vscode.window.showInformationMessage('Pull successful');
            } else {
                vscode.window.showErrorMessage(`Pull failed: ${result.stderr}`);
            }
        }
    );
}

/**
 * Fetch from remote
 */
async function fetch(uri?: vscode.Uri) {
    const filePath = getFilePath(uri);
    const gitRoot = filePath ? await getGitRoot(filePath) : vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    if (!gitRoot) {
        vscode.window.showErrorMessage('Not in a Git repository');
        return;
    }

    vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: 'Fetching from remote...',
            cancellable: false
        },
        async () => {
            const result = await executeGit(['fetch', '--all'], gitRoot);

            if (result.exitCode === 0) {
                vscode.window.showInformationMessage('Fetch successful');
            } else {
                vscode.window.showErrorMessage(`Fetch failed: ${result.stderr}`);
            }
        }
    );
}

/**
 * Merge branch
 */
async function merge(uri?: vscode.Uri) {
    const filePath = getFilePath(uri);
    const gitRoot = filePath ? await getGitRoot(filePath) : vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    if (!gitRoot) {
        vscode.window.showErrorMessage('Not in a Git repository');
        return;
    }

    const branches = await getBranches(gitRoot);
    const currentBranch = await getCurrentBranch(gitRoot);

    // Filter out current branch
    const otherBranches = branches.filter(b => b !== currentBranch);

    const selected = await vscode.window.showQuickPick(otherBranches, {
        placeHolder: 'Select branch to merge into current branch'
    });

    if (!selected) {
        return;
    }

    const result = await executeGit(['merge', selected], gitRoot);

    if (result.exitCode === 0) {
        vscode.window.showInformationMessage(`Merged ${selected} into ${currentBranch}`);
    } else {
        vscode.window.showErrorMessage(`Merge failed: ${result.stderr}`);
    }
}

/**
 * Rebase onto branch
 */
async function rebase(uri?: vscode.Uri) {
    const filePath = getFilePath(uri);
    const gitRoot = filePath ? await getGitRoot(filePath) : vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    if (!gitRoot) {
        vscode.window.showErrorMessage('Not in a Git repository');
        return;
    }

    const branches = await getBranches(gitRoot);
    const currentBranch = await getCurrentBranch(gitRoot);

    // Filter out current branch
    const otherBranches = branches.filter(b => b !== currentBranch);

    const selected = await vscode.window.showQuickPick(otherBranches, {
        placeHolder: 'Select branch to rebase onto'
    });

    if (!selected) {
        return;
    }

    const result = await executeGit(['rebase', selected], gitRoot);

    if (result.exitCode === 0) {
        vscode.window.showInformationMessage(`Rebased onto ${selected}`);
    } else {
        vscode.window.showErrorMessage(`Rebase failed: ${result.stderr}`);
    }
}

/**
 * Show branches and allow switching
 */
async function branches(uri?: vscode.Uri) {
    const filePath = getFilePath(uri);
    const gitRoot = filePath ? await getGitRoot(filePath) : vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    if (!gitRoot) {
        vscode.window.showErrorMessage('Not in a Git repository');
        return;
    }

    const branchList = await getBranches(gitRoot);
    const currentBranch = await getCurrentBranch(gitRoot);

    const items = branchList.map(branch => ({
        label: branch === currentBranch ? `* ${branch}` : `  ${branch}`,
        description: branch === currentBranch ? 'current' : '',
        branch
    }));

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select branch to checkout'
    });

    if (!selected || selected.branch === currentBranch) {
        return;
    }

    const result = await executeGit(['checkout', selected.branch], gitRoot);

    if (result.exitCode === 0) {
        vscode.window.showInformationMessage(`Switched to branch ${selected.branch}`);
    } else {
        vscode.window.showErrorMessage(`Checkout failed: ${result.stderr}`);
    }
}

/**
 * Create new branch
 */
async function newBranch(uri?: vscode.Uri) {
    const filePath = getFilePath(uri);
    const gitRoot = filePath ? await getGitRoot(filePath) : vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    if (!gitRoot) {
        vscode.window.showErrorMessage('Not in a Git repository');
        return;
    }

    const branchName = await vscode.window.showInputBox({
        prompt: 'Enter new branch name',
        placeHolder: 'feature/my-feature'
    });

    if (!branchName) {
        return;
    }

    const checkout = await vscode.window.showQuickPick(['Yes', 'No'], {
        placeHolder: 'Checkout new branch?'
    });

    const args = checkout === 'Yes' ? ['checkout', '-b', branchName] : ['branch', branchName];
    const result = await executeGit(args, gitRoot);

    if (result.exitCode === 0) {
        vscode.window.showInformationMessage(`Branch ${branchName} created${checkout === 'Yes' ? ' and checked out' : ''}`);
    } else {
        vscode.window.showErrorMessage(`Failed to create branch: ${result.stderr}`);
    }
}

/**
 * Create new tag
 */
async function newTag(uri?: vscode.Uri) {
    const filePath = getFilePath(uri);
    const gitRoot = filePath ? await getGitRoot(filePath) : vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    if (!gitRoot) {
        vscode.window.showErrorMessage('Not in a Git repository');
        return;
    }

    const tagName = await vscode.window.showInputBox({
        prompt: 'Enter tag name',
        placeHolder: 'v1.0.0'
    });

    if (!tagName) {
        return;
    }

    const message = await vscode.window.showInputBox({
        prompt: 'Enter tag message (optional)',
        placeHolder: 'Release version 1.0.0'
    });

    const args = message ? ['tag', '-a', tagName, '-m', message] : ['tag', tagName];
    const result = await executeGit(args, gitRoot);

    if (result.exitCode === 0) {
        vscode.window.showInformationMessage(`Tag ${tagName} created`);
    } else {
        vscode.window.showErrorMessage(`Failed to create tag: ${result.stderr}`);
    }
}

/**
 * Reset HEAD
 */
async function resetHead(uri?: vscode.Uri) {
    const filePath = getFilePath(uri);
    const gitRoot = filePath ? await getGitRoot(filePath) : vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    if (!gitRoot) {
        vscode.window.showErrorMessage('Not in a Git repository');
        return;
    }

    const mode = await vscode.window.showQuickPick(
        [
            { label: 'Soft', description: 'Keep changes in staging' },
            { label: 'Mixed', description: 'Keep changes in working directory' },
            { label: 'Hard', description: 'Discard all changes' }
        ],
        { placeHolder: 'Select reset mode' }
    );

    if (!mode) {
        return;
    }

    const revision = await vscode.window.showInputBox({
        prompt: 'Enter revision to reset to',
        placeHolder: 'HEAD~1'
    });

    if (!revision) {
        return;
    }

    const confirm = await vscode.window.showWarningMessage(
        `Reset HEAD to ${revision} (${mode.label})? This may discard changes.`,
        { modal: true },
        'Reset'
    );

    if (confirm !== 'Reset') {
        return;
    }

    const result = await executeGit(['reset', `--${mode.label.toLowerCase()}`, revision], gitRoot);

    if (result.exitCode === 0) {
        vscode.window.showInformationMessage('HEAD reset successfully');
    } else {
        vscode.window.showErrorMessage(`Reset failed: ${result.stderr}`);
    }
}

/**
 * Stash changes
 */
async function stashChanges(uri?: vscode.Uri) {
    const filePath = getFilePath(uri);
    const gitRoot = filePath ? await getGitRoot(filePath) : vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    if (!gitRoot) {
        vscode.window.showErrorMessage('Not in a Git repository');
        return;
    }

    const message = await vscode.window.showInputBox({
        prompt: 'Enter stash message (optional)',
        placeHolder: 'Work in progress'
    });

    const args = message ? ['stash', 'push', '-m', message] : ['stash'];
    const result = await executeGit(args, gitRoot);

    if (result.exitCode === 0) {
        vscode.window.showInformationMessage('Changes stashed');
    } else {
        vscode.window.showErrorMessage(`Stash failed: ${result.stderr}`);
    }
}

/**
 * Unstash (pop) changes
 */
async function unstashChanges(uri?: vscode.Uri) {
    const filePath = getFilePath(uri);
    const gitRoot = filePath ? await getGitRoot(filePath) : vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    if (!gitRoot) {
        vscode.window.showErrorMessage('Not in a Git repository');
        return;
    }

    const stashList = await getStashList(gitRoot);

    if (stashList.length === 0) {
        vscode.window.showInformationMessage('No stashes found');
        return;
    }

    const selected = await vscode.window.showQuickPick(
        stashList.map((item, index) => ({
            label: item,
            index
        })),
        { placeHolder: 'Select stash to apply' }
    );

    if (selected === undefined) {
        return;
    }

    const action = await vscode.window.showQuickPick(
        [
            { label: 'Pop', description: 'Apply and remove from stash list' },
            { label: 'Apply', description: 'Apply but keep in stash list' }
        ],
        { placeHolder: 'Select action' }
    );

    if (!action) {
        return;
    }

    const command = action.label.toLowerCase();
    const result = await executeGit(['stash', command, `stash@{${selected.index}}`], gitRoot);

    if (result.exitCode === 0) {
        vscode.window.showInformationMessage(`Stash ${command}ed successfully`);
    } else {
        vscode.window.showErrorMessage(`Stash ${command} failed: ${result.stderr}`);
    }
}

/**
 * Manage remotes
 */
async function manageRemotes(uri?: vscode.Uri) {
    const filePath = getFilePath(uri);
    const gitRoot = filePath ? await getGitRoot(filePath) : vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    if (!gitRoot) {
        vscode.window.showErrorMessage('Not in a Git repository');
        return;
    }

    const action = await vscode.window.showQuickPick(
        [
            { label: 'List Remotes', value: 'list' },
            { label: 'Add Remote', value: 'add' },
            { label: 'Remove Remote', value: 'remove' }
        ],
        { placeHolder: 'Select action' }
    );

    if (!action) {
        return;
    }

    switch (action.value) {
        case 'list': {
            const result = await executeGit(['remote', '-v'], gitRoot);
            if (result.exitCode === 0) {
                const channel = vscode.window.createOutputChannel('Git Remotes');
                channel.clear();
                channel.appendLine('Git Remotes:');
                channel.appendLine('='.repeat(80));
                channel.appendLine(result.stdout || 'No remotes configured');
                channel.show();
            } else {
                vscode.window.showErrorMessage(`Failed to list remotes: ${result.stderr}`);
            }
            break;
        }

        case 'add': {
            const name = await vscode.window.showInputBox({
                prompt: 'Enter remote name',
                placeHolder: 'origin'
            });

            if (!name) {
                return;
            }

            const url = await vscode.window.showInputBox({
                prompt: 'Enter remote URL',
                placeHolder: 'https://github.com/user/repo.git'
            });

            if (!url) {
                return;
            }

            const result = await executeGit(['remote', 'add', name, url], gitRoot);

            if (result.exitCode === 0) {
                vscode.window.showInformationMessage(`Remote ${name} added`);
            } else {
                vscode.window.showErrorMessage(`Failed to add remote: ${result.stderr}`);
            }
            break;
        }

        case 'remove': {
            const remotes = await getRemotes(gitRoot);

            if (remotes.length === 0) {
                vscode.window.showInformationMessage('No remotes configured');
                return;
            }

            const selected = await vscode.window.showQuickPick(remotes, {
                placeHolder: 'Select remote to remove'
            });

            if (!selected) {
                return;
            }

            const result = await executeGit(['remote', 'remove', selected], gitRoot);

            if (result.exitCode === 0) {
                vscode.window.showInformationMessage(`Remote ${selected} removed`);
            } else {
                vscode.window.showErrorMessage(`Failed to remove remote: ${result.stderr}`);
            }
            break;
        }
    }
}
