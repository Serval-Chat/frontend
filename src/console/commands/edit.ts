import type { ConCommandReactor } from '@/console/ConCommandRegistry';
import { DosEditorProgram } from '@/console/programs/DosEditorProgram';

export const editCommand: ConCommandReactor = {
    match: (_argc, argv) => argv[0]?.toLowerCase() === 'edit',
    execute: (_argc, argv, context) => {
        const path = argv.slice(1).join(' ');
        if (!path) {
            return { output: ['The syntax of the command is incorrect.'] };
        }
        if (
            !context.filesystem ||
            !context.terminal ||
            !context.startProgram ||
            !context.endProgram
        ) {
            return {
                output: ['EDIT: console does not support full-screen mode.'],
            };
        }

        context.startProgram(
            new DosEditorProgram({
                filesystem: context.filesystem,
                onExit: context.endProgram,
                path,
                terminal: context.terminal,
            }),
        );
        return {};
    },
};
