# WebStorm Style Git

A VSCode extension that brings WebStorm-style Git context menu commands to Visual Studio Code.

## Features

This extension adds a comprehensive Git submenu to the Explorer context menu (right-click on files and folders), similar to the Git integration in JetBrains WebStorm.

### Available Commands

Right-click on any file or folder in the Explorer to access these Git commands:

#### Commit & Staging
- **Commit File/Directory...** - Commit specific file or directory with a custom message
- **Add** - Stage changes for commit
- **Add to .gitignore** - Add file or directory to .gitignore

#### Diff & Compare
- **Show Diff** - View changes compared to HEAD
- **Compare with Revision...** - Compare with a specific commit
- **Compare with Branch or Tag...** - Compare with any branch or tag

#### History & Blame
- **Show History** - View commit history for the file or directory
- **Annotate with Git Blame** - Show who last modified each line

#### Changes Management
- **Rollback...** - Discard uncommitted changes

#### Sync Operations
- **Push...** - Push commits to remote repository
- **Pull...** - Pull changes from remote repository
- **Fetch** - Fetch updates from remote without merging

#### Branch Operations
- **Merge...** - Merge another branch into current branch
- **Rebase...** - Rebase current branch onto another branch
- **Branches...** - View and switch between branches
- **New Branch...** - Create a new branch
- **New Tag...** - Create a new tag
- **Reset HEAD...** - Reset to a specific commit (soft/mixed/hard)

#### Stash Operations
- **Stash Changes...** - Save changes to stash
- **Unstash Changes...** - Apply stashed changes

#### Remote Management
- **Manage Remotes...** - Add, remove, or view remote repositories

## Installation

Для установки расширения в VSCode или Cursor на macOS есть несколько способов.

**📖 Подробная инструкция: [INSTALL.md](INSTALL.md)**

### Быстрая установка (Рекомендуется)

1. Установите vsce: `npm install -g @vscode/vsce`
2. Упакуйте расширение: `npm run package`
3. Установите .vsix файл в VSCode/Cursor:
   - Откройте Extensions (⇧⌘X)
   - Меню "..." → "Install from VSIX..."
   - Выберите `webstorm-style-git-0.0.1.vsix`

### Режим разработки (для тестирования)

1. Откройте папку проекта в VSCode
2. Нажмите `F5` (или `Fn+F5` на macOS)
3. В новом окне Extension Development Host откройте Git репозиторий
4. Кликните правой кнопкой на файл → появится меню **Git**

## Usage

1. Open a folder containing a Git repository in VSCode
2. Right-click on any file or folder in the Explorer
3. Navigate to the **Git** submenu
4. Select the desired command

## Requirements

- VSCode 1.80.0 or higher
- Git installed and accessible from command line

## Extension Settings

This extension uses VSCode's built-in Git configuration:
- `git.path`: Path to Git executable (if Git is not in PATH)

## Known Issues

- Git Blame annotation uses fallback output channel instead of inline decorations
- Some commands require valid Git repository context

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT

## Inspired By

This extension is inspired by the excellent Git integration in JetBrains WebStorm.
