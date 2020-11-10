import * as tmi from 'tmi.js';
import * as auth from './data-access/auth-store';
import * as quotes from './data-access/quotation';
import { ChatCommandCollection, ChatCommand } from './irc/chat-command';
import { getCallResponse } from './irc/call-response';
import { parseCommandArgs } from './util';


global.HOME_CHANNEL = '#chipsbot';

let client: tmi.Client;
let cmdCollection: ChatCommandCollection;

(async function init() {
    await Promise.all([
        auth.initialiseTable(),
        quotes.initialiseTable(),
    ]);

    const usernames: string[] = await auth.getAllUsernames();

    const config: tmi.Options = {
        identity: {
            username: 'chipsbot',
            password: process.env.CLIENT_PASS,
        },
        connection: {
            reconnect: true,
            secure: true,
        },
        channels: [
            HOME_CHANNEL,
            ...usernames.map(p => '#'+p)
        ]
    };

    client = tmi.client(config);

    cmdCollection = new ChatCommandCollection(client);

    // Chat events
    client.on('connected', (addr, port) => console.log(`* Connected to ${addr}:${port}`));
    client.on('disconnected', (reason) => console.log(`* Disconnected: ${reason}`));
    client.on('message', onMessageHandler);

    client.connect().catch((err) => console.log(`* Failed to connect: ${err}`));
})();

function onMessageHandler(channel: string, userstate: tmi.Userstate, message: string, self: boolean) {
    if (self || userstate['message-type'] !== 'chat' || userstate.username === 'chipsbot') {
        return; // ignore messages from the bot
    }

    let [commandName, commandArgs] = parseCommandArgs(message.trim());
    
    if (commandName.startsWith(ChatCommand.Token)) {
        cmdCollection.tryRunCommand(commandName.substring(ChatCommand.Token.length), channel, userstate, commandArgs);
    } else {
        const resp: string = getCallResponse(message);
        if (resp) {
            client.say(channel, resp);
        }
        cmdCollection.chatRelays.doRelay(channel, userstate.username, message);
    }
}
