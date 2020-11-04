import { ChatRelay } from '../../src/irc/chat-relay';


describe('ChatRelay', () => {

    const channelName1: string = 'channel1';
    const channelName2: string = 'channel2';
    let relay: ChatRelay;

    beforeEach(() => {
        relay = new ChatRelay(channelName1);
    });

    describe('startRelaying', () => {

        test('does not relay the same channel', () => {
            relay.startRelaying(channelName1, [channelName1]);
            expect(relay.relayChannels).not.toContain(channelName1);
            expect(relay.relayChannels.length).toBe(0);
        });

        test('does not relay a channel that is already relayed', () => {
            relay.relayChannels = [channelName2];
            relay.startRelaying(channelName2, [channelName1, channelName2]);
            expect(relay.relayChannels).toContain(channelName2);
            expect(relay.relayChannels.length).toBe(1);
        });

        test('does not relay a channel that the bot is not in', () => {
            relay.startRelaying(channelName2, [channelName1]);
            expect(relay.relayChannels).not.toContain(channelName2);
            expect(relay.relayChannels.length).toBe(0);
        });

        test('is added to the relay collection', () => {
            relay.startRelaying(channelName2, [channelName1, channelName2]);
            expect(relay.relayChannels).toContain(channelName2);
            expect(relay.relayChannels.length).toBe(1);
        });

    });

    describe('doRelay', () => {

        const username: string = 'user1';
        const message: string = 'hello world';
        let mockEmit: jest.Mock;

        beforeEach(() => {
            mockEmit = jest.fn();
            relay.messager.emit = mockEmit;
        });

        test('relays a message when the originating channel is in the relay collection', () => {
            relay.relayChannels = [channelName2];
            relay.doRelay(channelName2, username, message);
            expect(mockEmit).toHaveBeenCalled();
        });

        test('does not relay a message when the channel is not in the relay collection', () => {
            relay.relayChannels = [];
            relay.doRelay(channelName2, username, message);
            expect(mockEmit).not.toHaveBeenCalled();
        });

    });

    describe('stopRelaying', () => {

        test('the relay collection is empty when called', () => {
            relay.relayChannels = [channelName1, channelName2];
            relay.stopRelaying();
            expect(relay.relayChannels.length).toBe(0);
        });

    });

    describe('removeRelayChannel', () => {

        beforeEach(() => {
            relay.relayChannels = [channelName1, channelName2];
        });

        test('channel is removed from the relay collection when the name matches', () => {
            relay.removeRelayChannel(channelName1);
            expect(relay.relayChannels).toContain(channelName2);
            expect(relay.relayChannels).not.toContain(channelName1);
        });

        test('no channels are removed from the relay collection when the name does not match', () => {
            relay.removeRelayChannel('blah');
            expect(relay.relayChannels).toContain(channelName2);
            expect(relay.relayChannels).toContain(channelName1);
        });

    });

});
