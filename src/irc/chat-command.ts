import { Permission } from 'irc/permission';
import { Userstate } from 'tmi.js';


export class ChatCommand {

    public static Token: string = '!';

    public name: string = '';
    public func: (channel: string, userstate: Userstate, commandArgs: string[]) => any;
    public permission: Permission;
    public help: string = '';

    constructor() {}

    public setName(arg: string) {
        this.name = arg;
        return this;
    }
    
    public setFunc(arg: (channel: string, userstate: Userstate, commandArgs: string[]) => any) {
        this.func = arg;
        return this;
    }

    public setPermission(arg: Permission) {
        this.permission = arg;
        return this;
    }

    public setHelp(arg: string) {
        this.help = arg;
        return this;
    }

}
