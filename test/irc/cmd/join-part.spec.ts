import { join, part } from '../../../src/irc/cmd/join-part';
import { removeUserRecord, upsertUserRecord } from '../../../src/data-access/auth-store';


jest.mock('../../../src/data-access/auth-store');

global['HOME_CHANNEL'] = 'home';

let mockInput: any = {};
let mockUserstate: any = {};
let mockChatRelays: any = {};
let mockClient: any = {};

const testUsername: string = 'test';
const testChannel: string = '#'+testUsername;

global['HOME_CHANNEL'] = testChannel;

beforeEach(() => {
    mockClient.say = jest.fn();
    mockClient.join = jest.fn();
    mockClient.part = jest.fn();
    mockClient.getChannels = jest.fn();
    mockClient.timeout = jest.fn();
    mockInput.client = mockClient;
    mockInput.channel = testChannel;
    mockUserstate.username = testUsername;
    mockInput.userstate = mockUserstate;
    mockChatRelays.stopRelay = jest.fn();
    mockChatRelays.removeRelayChannel = jest.fn();
    mockInput.chatRelays = mockChatRelays;
});

describe('join', () => {

    (upsertUserRecord as jest.Mock).mockResolvedValue('');

    test('can join a new channel', () => {
        mockInput.client.getChannels = jest.fn().mockReturnValue(['#someChannel1', '#someChannel2']);
        join(mockInput);
        expect(mockInput.client.join).toHaveBeenCalled();
    });

    test('does not join if already joined', () => {
        mockInput.client.getChannels = jest.fn().mockReturnValue(['#someChannel1', testChannel]);
        join(mockInput);
        expect(mockInput.client.join).not.toHaveBeenCalled();
    });

    test('does not allow joining from a non-home channel', () => {
        mockInput.channel = '#somethingelse';
        join(mockInput);
        expect(mockInput.client.join).not.toHaveBeenCalled();
    });

});

describe('part', () => {

    (removeUserRecord as jest.Mock).mockResolvedValue('');

    test('removes the input channel from the channel list when requested', () => {
        mockInput.channel = '#somethingelse';
        part(mockInput);
        expect(mockInput.client.part).toHaveBeenCalled();
    });

    test('never removes the home channel', () => {
        mockInput.channel = global['HOME_CHANNEL'];
        part(mockInput);
        expect(mockInput.client.part).not.toHaveBeenCalled();
    });

});
