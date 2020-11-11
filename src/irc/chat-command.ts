import { Client, Userstate } from 'tmi.js';
import { Permission } from '../irc/permission';
import * as ircCommands from '../irc/cmd/irc-commands';
import { ChatRelayCollection } from '../irc/chat-relay';


export class ChatCommandCollection {

    public chatRelays: ChatRelayCollection;
    public cmds: ChatCommand[] = [
        new ChatCommand().setName('help').setFunc(ircCommands.printHelpText).setHelp([], ['cmd_name'], 'prints help text??'),
        new ChatCommand().setName('join').setFunc(ircCommands.join).setHelp([], [], 'joins your channel'),
        new ChatCommand().setName('part').setFunc(ircCommands.part).setPermission(Permission.ChannelOwner).setHelp([], [], 'leaves the current channel'),
        new ChatCommand().setName('relay').setFunc(ircCommands.relay).setPermission(Permission.Mod).setHelp(['channel'], [], 'starts relaying chat messages from channel into the current channel'),
        new ChatCommand().setName('stoprelay').setFunc(ircCommands.stopRelay).setPermission(Permission.Mod).setHelp([], [], 'stops relaying chat messages from all channels into the current channel'),
        new ChatCommand().setName('quote').setFunc(ircCommands.quote).setHelp([], ['id'], 'prints a random quotation, [id] to specify'),
        new ChatCommand().setName('addquote').setFunc(ircCommands.addQuote).setPermission(Permission.Mod).setHelp(['quotation', 'quotee'], ['date'], 'adds a new quotation'),
        new ChatCommand().setName('modifyquote').setFunc(ircCommands.modifyQuote).setPermission(Permission.None).setHelp(['id', 'quotation', 'quotee'], ['date'], 'changes the quotation with the given id'),
        new ChatCommand().setName('jevon').setFunc(ircCommands.jevon).setHelp([], [], '-> jevon.txt'),
        new ChatCommand().setName('jevodds').setFunc(ircCommands.jevonOdds).setHelp([], [], '-> Jevon\'s odds'),
        new ChatCommand().setName('authorise').setFunc(ircCommands.authoriseBot).setPermission(Permission.ChannelOwner).setHelp([], ['code'], 'prints instructions for authorisation if no args provided, otherwise, attempts to authorise using [code]'),
        new ChatCommand().setName('streamtitle').setFunc(ircCommands.streamTitle).setPermission(Permission.Mod).setHelp([], ['title', 'game'], 'prints stream info if no args provided, otherwise, changes the current channel title to [title] and game to [game]'),
        new ChatCommand().setName('streampreset').setFunc(ircCommands.streamPreset).setPermission(Permission.Mod).setHelp([], ['preset'], 'prints available presets if no args provided, otherwise, changes the current channel title and game using [preset]'),
    ];

    constructor(private client: Client) {
        this.client = client;
        this.chatRelays = new ChatRelayCollection((channel: string, msg: string) => client.say(channel, msg));
    }

    public async tryRunCommand(commandName: string, channel: string, userstate: Userstate, commandArgs: string[]) {
        await this.cmds.find(p => p.name === commandName)?.run(this, {
            client: this.client,
            channel: channel,
            userstate: userstate,
            commandArgs: commandArgs,
            chatRelays: this.chatRelays,
            allCommands: this.cmds
        });
    }

}

export interface CmdInput {
    client: Client;
    channel: string;
    userstate: Userstate;
    commandArgs: string[];
    chatRelays: ChatRelayCollection;
    allCommands: ChatCommand[];
}

export class ChatCommand {

    public static Token: string = process.env.NODE_ENV === 'PROD' ? '!' : '~'; // so we don't need to shut down prod to run test

    public name: string = '';
    public func: (input: CmdInput) => any;
    public permission: Permission;
    public help: string = '';

    constructor() {}

    public setName(arg: string) {
        this.name = arg;
        return this;
    }
    
    public setFunc(arg: (input: CmdInput) => any) {
        this.func = arg;
        return this;
    }

    public setPermission(arg: Permission) {
        this.permission = arg;
        return this;
    }

    public setHelp(requiredArgs: string[], optionalArgs: string[], body: string) {
        const args: string = requiredArgs.concat(optionalArgs.map(p => `[${p}]`)).join(', ');
        this.help = `${args} -> ${body}`.trim();
        return this;
    }

    public async run(thisRef: any, input: CmdInput) {
        if (!this.userIsPermitted(input.channel, input.userstate, this.permission)) {
            console.log(`* Permission denied for user ${input.userstate.username} on ${input.channel} using command: ${this.name}`);
            input.client.say(input.channel, 'Permission denied');
            return;
        }
        
        try {
            await this.func.apply(thisRef, [input]);
        } catch (e) {
            input.client.say(input.channel, `Oopsie woopsie wee fucky wuckey a wittle fucko boingo: ${e.message}`);
            console.error(e.message);
            if (e.stack) {
                console.error(e.stack);
            }
        }

        this.logCmd(input.channel, this.name, input.commandArgs);
    }

    private userIsPermitted(channelName: string, userstate: Userstate, permission: Permission): boolean {
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

    private logCmd(channel: string, commandName: string, commandArgs: string[]) {
        let str = `* Executed ${commandName} command on ${channel}`;
        if (commandArgs.length > 0) {
            str += ` w/ args ${commandArgs}`;
        }
        console.log(str);
    }

}
