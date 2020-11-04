import * as tmi from 'tmi.js';
import * as req from './http/twitch-api';
import { File } from './data-access/file';
import * as auth from './data-access/auth-store';
import * as quotes from './data-access/quotation';
import { ChatCommand } from './irc/chat-command';
import { ChatRelayCollection } from './irc/chat-relay';
import { Permission } from './irc/permission';
import { formatDate } from './util';


const HOME_CHANNEL: string = '#chipsbot';
const jevonFile: File = new File('jvn.txt');
let client: tmi.Client;
let chatRelays: ChatRelayCollection;

const cmds: ChatCommand[] = [
    new ChatCommand().setName('help').setFunc(printHelpText).setHelp('[cmd_name] -> prints help text??'),
    new ChatCommand().setName('join').setFunc(join).setHelp('-> joins your channel'),
    new ChatCommand().setName('part').setFunc(part).setPermission(Permission.ChannelOwner).setHelp('-> leaves the current channel'),
    new ChatCommand().setName('relay').setFunc(relay).setPermission(Permission.Mod).setHelp('channel -> starts relaying chat messages from channel into the current channel'),
    new ChatCommand().setName('stoprelay').setFunc(stopRelay).setPermission(Permission.Mod).setHelp('-> stops relaying chat messages from all channels into the current channel'),
    new ChatCommand().setName('quote').setFunc(quote).setHelp('[id] -> prints a random quotation, [id] to specify'),
    new ChatCommand().setName('addquote').setFunc(addQuote).setPermission(Permission.Mod).setHelp('"quotation" quotee [date] -> adds a new quotation'),
    new ChatCommand().setName('modifyquote').setFunc(modifyQuote).setPermission(Permission.None).setHelp('id "quotation" quotee [date] -> changes the quotation with the given id'),
    new ChatCommand().setName('jevon').setFunc(jevon).setHelp('-> jevon.txt'),
    new ChatCommand().setName('jevodds').setFunc(jevonOdds).setHelp('-> Jevon\'s odds'),
    new ChatCommand().setName('authorise').setFunc(authoriseBot).setPermission(Permission.ChannelOwner).setHelp('[code] -> prints instructions for authorisation if no args provided, otherwise, attempts to authorise using [code]'),
    new ChatCommand().setName('streamtitle').setFunc(streamTitle).setPermission(Permission.Mod).setHelp('[title] [game] -> prints stream info if no args provided, otherwise, changes the current channel title to [title] and game to [game]'),
    new ChatCommand().setName('streampreset').setFunc(streamPreset).setPermission(Permission.Mod).setHelp('[preset] -> prints available presets if no args provided, otherwise, changes the current channel title and game using [preset]'),
];

const callResponses: { identifier: string, response: string }[] = [
    { identifier: 'shizze', response: 'shizze play outlast OneHand' },
    { identifier: 'krat', response: 'http://krat.club/ yes yes yes' },
];

init();

async function init() {
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

    chatRelays = new ChatRelayCollection((channel: string, msg: string) => client.say(channel, msg));

    // Chat events
    client.on('connected', (addr, port) => console.log(`* Connected to ${addr}:${port}`));
    client.on('disconnected', (reason) => console.log(`* Disconnected: ${reason}`));
    client.on('message', onMessageHandler);

    client.connect().catch((err) => console.log(`* Failed to connect: ${err}`));
}

async function onMessageHandler(channel: string, userstate: tmi.Userstate, message: string, self: boolean) {
    if (self || userstate['message-type'] !== 'chat') {
        return; // ignore messages from the bot
    }

    const result = getCommandArgs(message.trim());
    let commandName: string = result.cmd;
    const commandArgs: string[] = result.args;
    
    if (commandName.startsWith(ChatCommand.Token)) { // TODO chatcommandcollection class to store the token and handle this validation n such?
        commandName = commandName.substring(ChatCommand.Token.length);
        const i: number = cmds.map(p => p.name).indexOf(commandName);
        if (i === -1) {
            return;
        }

        const cmd: ChatCommand = cmds[i];
        
        if (!userIsPermitted(channel, userstate, cmd.permission)) {
            console.log(`* Permission denied for user ${userstate.username} on ${channel} using command: ${cmd.name}`);
            client.say(channel, 'Permission denied');
            return;
        }
        
        try {
            await cmd.func(channel, userstate, commandArgs);
        } catch (e) {
            client.say(channel, `Oopsie woopsie wee fucky wuckey a wittle fucko boingo: ${e.message}`);
            console.error(e.message);
            if (e.stack) {
                console.error(e.stack);
            }
        }
        logCmd(channel, commandName, commandArgs);
    } else {
        checkCallResponses(channel, message);
        chatRelays.doRelay(channel, userstate.username, message);
    }
}

function userIsPermitted(channelName: string, userstate: tmi.Userstate, permission: Permission): boolean {
    if (userstate.username?.toLowerCase() === 'freechips') {
        return true;
    }
    switch (permission) {
        case Permission.None:
            return false;
        case Permission.ChannelOwner:
            return `#${userstate.username}` === channelName;
        case Permission.Mod:
            return userstate.mod || (userstate.badges && userstate.badges.broadcaster === '1');
        case Permission.Any:
        default:
            return true;
    }
}

function checkCallResponses(channel: string, message: string) {
    const i: number = callResponses.findIndex(p => message.toLowerCase().includes(p.identifier)); // just take the first identifier found, in case there are multiple in one message
    if (i < 0) {
        return;
    }
    client.say(channel, callResponses[i].response);
}

// Chat cmd functions
function printHelpText(channel: string, userstate: tmi.Userstate, commandArgs: string[]) {
    if (commandArgs.length === 0) {
        const cmdList: string = cmds.map(p => ChatCommand.Token + p.name).join(', ');
        client.say(channel, `Commands: ${cmdList}`);
    } else if (commandArgs.length === 1) {
        const i: number = cmds.map(p => p.name).indexOf(commandArgs[0]);
        if (i === -1) {
            client.say(channel, 'Unrecognised command');
            return;
        }
        client.say(channel, `Usage: ${ChatCommand.Token}${cmds[i].name} ${cmds[i].help}`);
    }
}

function join(channel: string, userstate: tmi.Userstate, commandArgs: string[]) {
    if (channel !== HOME_CHANNEL) {
        client.say(channel, `Go to ${HOME_CHANNEL} to request a channel join`);
        return;
    }

    const targetChannel: string = '#' + userstate.username;

    if (client.getChannels().includes(targetChannel)) {
        client.say(HOME_CHANNEL, `Already in ${targetChannel}`);
        return;
    }
    client.join(targetChannel);
    auth.upsertUserRecord({ username: targetChannel.substring(1), userId: null, accessToken: null, refreshToken: null }); // think we don't need to await here
    client.say(HOME_CHANNEL, `Joining ${targetChannel}`);
}

function part(channel: string, userstate: tmi.Userstate, commandArgs: string[]) {
    if (channel === HOME_CHANNEL) {
        client.say(channel, 'You have no power here');
        client.timeout(channel, userstate.username, 300, 'nice try');
        return;
    }

    stopRelay(channel, userstate, commandArgs);
    chatRelays.removeRelayChannel(channel);
    
    // Remove from saved channels
    auth.removeUserRecord({ username: channel.substring(1), userId: null, accessToken: null, refreshToken: null });
    
    client.say(channel, 'Goodbye...');
    client.part(channel);
}

function relay(channel: string, userstate: tmi.Userstate, commandArgs: string[]) {
    if (!commandArgs || commandArgs.length !== 1) {
        console.log(`* Invalid args: ${commandArgs}`);
        return;
    }
    let targetChannel = commandArgs[0].startsWith('#') ? commandArgs[0] : '#' + commandArgs[0];
    chatRelays.startRelay(channel, targetChannel, client.getChannels());
}

function stopRelay(channel: string, userstate: tmi.Userstate, commandArgs: string[]) {
    chatRelays.stopRelay(channel);
}

async function quote(channel: string, userstate: tmi.Userstate, commandArgs: string[]) {
    const record = await quotes.getQuotation(parseInt(commandArgs[0]) || null);
    const date = record.customDate != null ? record.customDate : formatDate(record.date);
    const quote: string = `#${record.index} "${record.quotation}" -${record.person}${date ? ', '+date : ''}`;
    client.say(channel, quote);
    chatRelays.reverseBroadcast(channel, quote);
}

async function addQuote(channel: string, userstate: tmi.Userstate, commandArgs: string[]) {
    if (commandArgs.length <= 1 || commandArgs.length >= 4) {
        client.say(channel, 'Invalid args');
        return;
    }

    let potentialDate: Date = new Date(commandArgs[2]);
    let record: quotes.QuotationRecord = { quotation: commandArgs[0], person: commandArgs[1], date: potentialDate };

    if (commandArgs.length === 3 && isNaN(potentialDate.getTime())) {
        record.date = new Date();
        record.customDate = commandArgs[2];
    }

    const newQuoteNum: number = await quotes.insertQuotation(record);
    client.say(channel, `Quotation #${newQuoteNum} added`);
}

async function modifyQuote(channel: string, userstate: tmi.Userstate, commandArgs: string[]) {
    if (commandArgs.length <= 2 || commandArgs.length >= 5) {
        client.say(channel, 'Invalid args');
        return;
    }

    let potentialDate: Date = new Date(commandArgs[3]);
    let record: quotes.QuotationRecord = { index: parseInt(commandArgs[0]), quotation: commandArgs[1], person: commandArgs[2], date: potentialDate };

    if (commandArgs.length === 4 && isNaN(potentialDate.getTime())) {
        record.date = new Date();
        record.customDate = commandArgs[3];
    }

    await quotes.updateQuotation(record);
    client.say(channel, `Quotation #${commandArgs[0]} updated`);
}

function jevon(channel: string, userstate: tmi.Userstate, commandArgs: string[]) {
    const lines: string[] = jevonFile.readLines();
    
    const forename: string[] = lines[0].split(',');
    const surname1: string[] = lines[1].split(',');
    const surname2: string[] = lines[2].split(',');
    
    const randomIndex0: number = Math.floor(Math.random() * forename.length);
    const randomIndex1: number = Math.floor(Math.random() * surname1.length);
    const randomIndex2: number = Math.floor(Math.random() * surname2.length);

    const fullName = `${forename[randomIndex0]} ${surname1[randomIndex1]}${surname2[randomIndex2]}`;
    client.say(channel, fullName);
    chatRelays.reverseBroadcast(channel, fullName);
}

function jevonOdds(channel: string, userstate: tmi.Userstate, commandArgs: string[]) {
    const lines: string[] = jevonFile.readLines();
    const odds: number = lines.reduce((acc, cur) => cur.split(',').length * acc, 1);
    const oddsString = `There are currently ${odds.toLocaleString()} possible !jevon combinations`;
    client.say(channel, oddsString);
    chatRelays.reverseBroadcast(channel, oddsString);
}

async function authoriseBot(channel: string, userstate: tmi.Userstate, commandArgs: string[]) {
    if (commandArgs.length !== 1) {
        client.say(channel, `Visit the following link ( ${req.getAuthUrl()} ), authorise Chipsbot, then use the code from the URL address bar on the redirected page as an argument to this cmd`);
        return;
    }
    const code: string = commandArgs[0];
    await req.newAuthToken(userstate.username, code);
    client.say(channel, 'Authorisation successful');
}

async function streamTitle(channel: string, userstate: tmi.Userstate, commandArgs: string[]) {
    const channelName: string = channel.substring(1); // remove the irc #
    if (commandArgs.length === 0) {
        const info: string = await req.getStreamInfo(channelName);
        client.say(channel, info);
        return;
    }
    if (commandArgs.length > 2) {
        client.say(channel, 'Invalid args');
        return;
    }
    const newTitle: string = commandArgs[0];
    const newGame: string = commandArgs.length === 2 ? commandArgs[1] : null;
    await req.updateStreamInfo(channelName, newGame, newTitle);
    client.say(channel, 'Stream title updated successfully');
}

const p2id: string = 'Portal 2';
const papoid: string = 'Papo & Yo';
const dkc2id: string = "Donkey Kong Country 2: Diddy's Kong Quest";
type StreamPreset = { id: string, title: string };
const streamPresets: { [key: string] : StreamPreset } = {
    p2coop: { id: p2id, title: "Coop speedruns w/ Dire for 26" },
    paporace: { id: papoid, title: "Papo races" },
    dkc2any: { id: dkc2id, title: "any% runs for 39" },
};

async function streamPreset(channel: string, userstate: tmi.Userstate, commandArgs: string[]) {
    const channelName: string = channel.substring(1);
    if (!commandArgs || commandArgs.length !== 1) {
        client.say(channel, Object.keys(streamPresets).join(', '));
        return;
    }
    const preset: StreamPreset = streamPresets[commandArgs[0]];
    await req.updateStreamInfo(channelName, preset.id, preset.title);
    client.say(channel, 'Stream title updated successfully');
}

// Helpers
function getCommandArgs(str: string): { cmd: string, args: string[] } {
    let protoArgs: string[] = str.split(' ');
    let args: string[] = [];
    const cmd: string = protoArgs.shift();
    let isQuote: boolean = false;
    let quotedCmd: string[] = [];

    for (let arg of protoArgs) { // TODO what if an arg is " " or "" ?
        if (arg.startsWith('"')) {
            isQuote = true;
            arg = arg.substring(1);
            quotedCmd = [];
        }
        if (arg.endsWith('"')) {
            isQuote = false;
            quotedCmd.push(arg.substring(0, arg.length-1));
            args.push(quotedCmd.join(' '));
            continue;
        }
        
        if (!isQuote) {
            args.push(arg);
        } else {
            quotedCmd.push(arg);
        }
    }
    if (isQuote) {
        args = [];
    }
    
    return { cmd: cmd, args: args };
}

function logCmd(channel: string, commandName: string, commandArgs: string[]) {
    let str = `* Executed ${commandName} command on ${channel}`;
    if (commandArgs.length > 0) {
        str += ` w/ args ${commandArgs}`;
    }
    console.log(str);
}
