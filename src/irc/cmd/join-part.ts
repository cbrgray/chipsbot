import * as auth from '../../data-access/auth-store';
import { CmdInput } from '../../irc/chat-command';


export function join(input: CmdInput) {
    if (input.channel !== HOME_CHANNEL) {
        input.client.say(input.channel, `Go to ${HOME_CHANNEL} to request a channel join`);
        return;
    }

    const targetChannel: string = '#' + input.userstate.username;

    if (input.client.getChannels().includes(targetChannel)) {
        input.client.say(HOME_CHANNEL, `Already in ${targetChannel}`);
        return;
    }
    input.client.join(targetChannel);
    auth.upsertUserRecord({ username: targetChannel.substring(1), userId: null, accessToken: null, refreshToken: null }); // think we don't need to await here
    input.client.say(HOME_CHANNEL, `Joining ${targetChannel}`);
}

export function part(input: CmdInput) {
    if (input.channel === HOME_CHANNEL) {
        input.client.say(input.channel, 'You have no power here');
        input.client.timeout(input.channel, input.userstate.username, 300, 'nice try');
        return;
    }

    input.chatRelays.stopRelay(input.channel);
    input.chatRelays.removeRelayChannel(input.channel);
    
    // Remove from saved channels
    auth.removeUserRecord({ username: input.channel.substring(1), userId: null, accessToken: null, refreshToken: null });
    
    input.client.say(input.channel, 'Goodbye...');
    input.client.part(input.channel);
}
