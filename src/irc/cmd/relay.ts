import { CmdInput } from '../../irc/chat-command';


export function relay(input: CmdInput) {
    if (!input.commandArgs || input.commandArgs.length !== 1) {
        console.log(`* Invalid args: ${input.commandArgs}`);
        return;
    }
    let targetChannel = input.commandArgs[0].startsWith('#') ? input.commandArgs[0] : '#' + input.commandArgs[0];
    input.chatRelays.startRelay(input.channel, targetChannel, input.client.getChannels());
}

export function stopRelay(input: CmdInput) {
    input.chatRelays.stopRelay(input.channel);
}
