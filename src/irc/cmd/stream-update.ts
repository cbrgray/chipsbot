import * as req from '../../http/twitch-api';
import { CmdInput } from '../../irc/chat-command';


export async function authoriseBot(input: CmdInput) {
    if (input.commandArgs.length !== 1) {
        input.client.say(input.channel, `Visit the following link ( ${req.getAuthUrl()} ), authorise Chipsbot, then use the code from the URL address bar on the redirected page as an argument to this cmd`);
        return;
    }
    const code: string = input.commandArgs[0];
    await req.newAuthToken(input.userstate.username, code);
    input.client.say(input.channel, 'Authorisation successful');
}

export async function streamTitle(input: CmdInput) {
    const channelName: string = input.channel.substring(1); // remove the irc #
    if (input.commandArgs.length === 0) {
        const info: string = await req.getStreamInfo(channelName);
        input.client.say(input.channel, info);
        return;
    }
    if (input.commandArgs.length > 2) {
        input.client.say(input.channel, 'Invalid args');
        return;
    }
    const newTitle: string = input.commandArgs[0];
    const newGame: string = input.commandArgs.length === 2 ? input.commandArgs[1] : null;
    await req.updateStreamInfo(channelName, newGame, newTitle);
    input.client.say(input.channel, 'Stream title updated successfully');
}

type StreamPreset = { id: string, title: string };
const p2id: string = 'Portal 2';
const papoid: string = 'Papo & Yo';
const dkc2id: string = "Donkey Kong Country 2: Diddy's Kong Quest";
const streamPresets: { [key: string] : StreamPreset } = {
    p2coop: { id: p2id, title: "Coop speedruns w/ Dire for 26" },
    paporace: { id: papoid, title: "Papo races" },
    dkc2any: { id: dkc2id, title: "any% runs for 39" },
};

export async function streamPreset(input: CmdInput) {
    const channelName: string = input.channel.substring(1);
    if (!input.commandArgs || input.commandArgs.length === 0) {
        input.client.say(input.channel, Object.keys(streamPresets).join(', '));
        return;
    }
    const preset: StreamPreset = streamPresets[input.commandArgs[0]];
    if (!preset) {
        input.client.say(input.channel, 'Invalid preset');
        return;
    }
    let title = input.commandArgs.length === 2 ? input.commandArgs[1] : preset.title;
    await req.updateStreamInfo(channelName, preset.id, title);
    input.client.say(input.channel, 'Stream title updated successfully');
}
