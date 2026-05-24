import { ConCommandRegistry } from '@/console/ConCommandRegistry';
import { clsCommand } from '@/console/commands/cls';
import { dateCommand } from '@/console/commands/date';
import { dotSlashCommand } from '@/console/commands/dotSlash';
import { echoCommand } from '@/console/commands/echo';
import { fallbackCommand } from '@/console/commands/fallback';
import { helpCommand } from '@/console/commands/help';
import { progressCommand } from '@/console/commands/progress';
import { runCommand } from '@/console/commands/run';
import { timeCommand } from '@/console/commands/time';
import { userctlCommand } from '@/console/commands/userctl';
import { verCommand } from '@/console/commands/ver';

export { ConCommandRegistry } from '@/console/ConCommandRegistry';
export type {
    CommandContext,
    CommandResult,
    ConCommandReactor,
} from '@/console/ConCommandRegistry';

export const registry = new ConCommandRegistry();

registry.register(echoCommand);
registry.register(dotSlashCommand);
registry.register(runCommand);
registry.register(helpCommand);
registry.register(verCommand);
registry.register(clsCommand);
registry.register(dateCommand);
registry.register(timeCommand);
registry.register(userctlCommand);
registry.register(progressCommand);
registry.register(fallbackCommand);
