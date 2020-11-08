import { ChatCommand, CmdInput } from '../../irc/chat-command';


export function printHelpText(input: CmdInput) {
    if (input.commandArgs.length === 0) {
        const cmdList: string = input.allCommands.map(p => ChatCommand.Token + p.name).join(', ');
        input.client.say(input.channel, `Commands: ${cmdList}`);
    } else if (input.commandArgs.length === 1) {
        const cmd: ChatCommand = input.allCommands.find(p => p.name === input.commandArgs[0]);
        if (!cmd) {
            input.client.say(input.channel, 'Unrecognised command');
            return;
        }
        input.client.say(input.channel, `Usage: ${ChatCommand.Token}${cmd.name} ${cmd.help}`);
    }
}
