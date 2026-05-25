import { ConCommandRegistry } from '@/console/ConCommandRegistry';
import { clsCommand } from '@/console/commands/cls';
import { dateCommand } from '@/console/commands/date';
import { dotSlashCommand } from '@/console/commands/dotSlash';
import { echoCommand } from '@/console/commands/echo';
import { editCommand } from '@/console/commands/edit';
import { fallbackCommand } from '@/console/commands/fallback';
import { filesystemCommands } from '@/console/commands/filesystem';
import { helpCommand } from '@/console/commands/help';
import { modeCommand } from '@/console/commands/mode';
import { progressCommand } from '@/console/commands/progress';
import { runCommand } from '@/console/commands/run';
import { snakeCommand } from '@/console/commands/snake';
import { timeCommand } from '@/console/commands/time';
import { userctlCommand } from '@/console/commands/userctl';
import { verCommand } from '@/console/commands/ver';

export { ConCommandRegistry } from '@/console/ConCommandRegistry';
export { DosFileSystem } from '@/console/DosFileSystem';
export { Terminal } from '@/console/Terminal';
export type {
    ConsoleKeyEvent,
    ConsoleProgram,
    CommandContext,
    CommandResult,
    ConCommandReactor,
} from '@/console/ConCommandRegistry';
export type { TerminalLine, TerminalSize } from '@/console/Terminal';
export type { DosAttribute, DosEntry } from '@/console/DosFileSystem';

export const registry = new ConCommandRegistry();

registry.register(echoCommand);
registry.register(dotSlashCommand);
registry.register(runCommand);
registry.register(helpCommand);
registry.register(modeCommand);
registry.register(verCommand);
registry.register(clsCommand);
registry.register(dateCommand);
registry.register(timeCommand);
for (const command of filesystemCommands) {
    registry.register(command);
}
registry.register(editCommand);
registry.register(userctlCommand);
registry.register(progressCommand);
registry.register(snakeCommand);
registry.register(fallbackCommand);
