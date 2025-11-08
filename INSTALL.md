# Установка WebStorm Style Git на macOS

Есть несколько способов установить расширение на вашей системе.

## Способ 1: Упаковка в .vsix и установка через VSCode/Cursor (Рекомендуется)

### Шаг 1: Установите vsce (если еще не установлено)

```bash
npm install -g @vscode/vsce
```

### Шаг 2: Упакуйте расширение

В корневой папке проекта выполните:

```bash
npm run package
```

Или напрямую:

```bash
vsce package
```

Это создаст файл `webstorm-style-git-0.0.1.vsix` в корне проекта.

### Шаг 3: Установите .vsix файл в VSCode/Cursor

#### Через интерфейс:

1. Откройте VSCode или Cursor
2. Откройте панель расширений (⇧⌘X или Cmd+Shift+X)
3. Нажмите на меню "..." (три точки) в правом верхнем углу панели Extensions
4. Выберите "Install from VSIX..."
5. Выберите файл `webstorm-style-git-0.0.1.vsix`
6. Перезагрузите VSCode/Cursor (команда "Reload Window")

#### Через командную строку:

```bash
# Для VSCode
code --install-extension webstorm-style-git-0.0.1.vsix

# Для Cursor
cursor --install-extension webstorm-style-git-0.0.1.vsix
```

## Способ 2: Ручная установка (копирование в папку расширений)

### Шаг 1: Найдите папку расширений

Для VSCode:
```
~/.vscode/extensions/
```

Для Cursor:
```
~/.cursor/extensions/
```

### Шаг 2: Создайте папку расширения

```bash
# Для VSCode
mkdir -p ~/.vscode/extensions/webstorm-style-git-0.0.1

# Для Cursor
mkdir -p ~/.cursor/extensions/webstorm-style-git-0.0.1
```

### Шаг 3: Скопируйте файлы

```bash
# Находясь в корне проекта vscode-git-extension

# Для VSCode
cp -r package.json out ~/.vscode/extensions/webstorm-style-git-0.0.1/

# Для Cursor
cp -r package.json out ~/.cursor/extensions/webstorm-style-git-0.0.1/
```

### Шаг 4: Перезагрузите VSCode/Cursor

- Откройте Command Palette (⇧⌘P или Cmd+Shift+P)
- Выполните команду: `Developer: Reload Window`

## Способ 3: Режим разработки (для тестирования)

Этот способ не устанавливает расширение постоянно, но удобен для разработки:

1. Откройте папку `vscode-git-extension` в VSCode
2. Нажмите F5 или выберите в меню: Run → Start Debugging
3. Откроется новое окно "[Extension Development Host]"
4. В этом окне откройте любую папку с Git репозиторием
5. Расширение будет активно только в этом окне

## Проверка установки

После установки:

1. Откройте любую папку с Git репозиторием
2. В Explorer кликните правой кнопкой на любой файл или папку
3. В контекстном меню должен появиться пункт **Git** с подменю

## Удаление расширения

### Через интерфейс:
1. Откройте панель Extensions (⇧⌘X)
2. Найдите "WebStorm Style Git"
3. Нажмите на шестеренку → Uninstall

### Вручную:
```bash
# Для VSCode
rm -rf ~/.vscode/extensions/webstorm-style-git-0.0.1

# Для Cursor
rm -rf ~/.cursor/extensions/webstorm-style-git-0.0.1
```

## Обновление расширения

При выходе новой версии:

1. Удалите старую версию (см. выше)
2. Установите новую версию одним из способов выше
3. Или просто установите новый .vsix поверх старой версии - он автоматически обновится

## Troubleshooting

### Расширение не появляется после установки

- Убедитесь, что вы перезагрузили VSCode/Cursor
- Проверьте, что папка `out/` содержит скомпилированные .js файлы
- Выполните `npm run compile` еще раз

### Контекстное меню Git не появляется

- Убедитесь, что вы открыли папку с Git репозиторием
- Проверьте в Developer Tools (Help → Toggle Developer Tools) на наличие ошибок

### Команды не работают

- Проверьте, что Git установлен и доступен через командную строку: `git --version`
- Проверьте консоль разработчика на наличие ошибок (Help → Toggle Developer Tools)

## Рекомендуемый путь установки

Для постоянного использования рекомендую **Способ 1** - он самый надежный и позволяет управлять расширением через стандартный интерфейс VSCode/Cursor.
