import { Userstate } from 'tmi.js';
import { Permission } from './permission';


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

    // TODO can we somehow run the permission check(s) automatically when calling func from here? or use decorators?
    public setPermission(arg: Permission) { // TODO should be able to combine multiple permissions in an OR fashion
        this.permission = arg;
        return this;
    }

    public setHelp(arg: string) {
        this.help = arg;
        return this;
    }

}
