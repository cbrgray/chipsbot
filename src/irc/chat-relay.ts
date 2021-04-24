import { EventEmitter } from 'events';


export class ChatRelayCollection {

    public chatRelays: ChatRelay[] = [];
    private messageCallback: (channel: string, msg: string) => void;

    constructor(messageCallback: (channel: string, msg: string) => void) {
        this.messageCallback = messageCallback; // alternatively we can just pass the client object and use it directly, although this method avoids having to import tmi.js, which feels messy
    }

    public startRelay(thisChannel: string, targetChannel: string, clientChannels: string[]) {
        let curRelay = this.initRelay(thisChannel);
        curRelay.startRelaying(targetChannel, clientChannels);
    }
    
    public stopRelay(channel: string) {
        let curRelay = this.chatRelays.find(p => p.channel === channel);
        if (curRelay) {
            curRelay.stopRelaying();
            this.chatRelays = this.chatRelays.filter(p => p.channel !== curRelay.channel);
            curRelay = null;
        }
    }
    
    private initRelay(channel: string): ChatRelay {
        let curRelay = this.chatRelays.find(p => p.channel === channel);
        if (!curRelay) {
            curRelay = new ChatRelay(channel); // could also pass a callback in this constructor instead, but idk meh
            this.chatRelays.push(curRelay);
            this.startListeningTo(curRelay);
        }
        return curRelay;
    }
    
    public doRelay(targetChannel: string, displayName: string, message: string) {
        this.chatRelays.forEach(p => p.doRelay(targetChannel, displayName, message));
    }
    
    private startListeningTo(relay: ChatRelay) {
        relay.messager.on(ChatRelay.EVENT_NAME, (msg: string) => this.messageCallback(relay.channel, msg));
    }

    public removeRelayChannel(channel: string) {
        for (let chatRelay of this.chatRelays) {
            chatRelay.removeRelayChannel(channel);
        }
    }

    public broadcast(channel: string, message: string) { // to all relayed channels
        this.chatRelays.find(p => p.channel === channel).relayChannels.forEach(p => this.messageCallback(p, message));
    }

    public reverseBroadcast(channel: string, message: string) { // to all channels relaying this one
        this.chatRelays.filter(p => p.relayChannels.includes(channel)).forEach(p => this.messageCallback(p.channel, message));
    }

}

export class ChatRelay {

    public readonly channel: string = '';
    public readonly messager: EventEmitter = new EventEmitter();
    public static readonly EVENT_NAME: string = 'msg';
    public relayChannels: string[] = [];

    constructor(channel: string) {
        this.channel = channel;
    }
    
    public doRelay(targetChannel: string, displayName: string, message: string) {
        if (this.relayChannels.includes(targetChannel)) {
            this.emitMessage(`<${displayName}> ${message}`);
        }
    }
    
    public startRelaying(targetChannel: string, clientChannels: string[]) {
        if (this.channel === targetChannel) {
            this.emitMessage("Can't relay messages from the same channel");
            return;
        }
        if (this.relayChannels.includes(targetChannel)) {
            this.emitMessage(`Already relaying messages from ${targetChannel}`);
            return;
        }
        if (!clientChannels.includes(targetChannel)) {
            this.emitMessage(`Chipsbot is not in ${targetChannel}, try again after joining`);
            return;
        }
        this.relayChannels.push(targetChannel);
        this.emitMessage(`Now relaying messages from ${targetChannel}`);
    }
    
    public stopRelaying() {
        if (this.relayChannels.length > 0) {
            this.emitMessage('Ceasing relaying messages');
        }
        this.relayChannels = [];
    }

    public removeRelayChannel(targetChannel: string) {
        this.relayChannels = this.relayChannels.filter(channel => channel !== targetChannel);
    }

    private emitMessage(message: string) {
        this.messager.emit(ChatRelay.EVENT_NAME, message);
    }

}
