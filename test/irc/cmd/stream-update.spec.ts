import { updateStreamInfo } from '../../../src/http/twitch-api';
import { streamPreset } from '../../../src/irc/cmd/stream-update';


jest.mock('../../../src/http/twitch-api');

let mockInput: any = {};
let mockClient: any = {};

describe('streamPreset', () => {

    beforeEach(() => {
        mockInput.client = mockClient;
        mockInput.channel = '#somechannel';
        (updateStreamInfo as jest.Mock).mockReset();
    });

    let testPreset: string = 'dkc2any';

    test('prints when no args provided', async () => {
        mockInput.client.say = jest.fn();
        mockInput.commandArgs = [];
        await streamPreset(mockInput);
        expect(mockInput.client.say).toHaveBeenCalled();
        expect(updateStreamInfo).not.toHaveBeenCalled();
    });

    test('updates when 1 or 2 args provided', async () => {
        mockInput.client.say = jest.fn();
        mockInput.commandArgs = [testPreset];
        await streamPreset(mockInput);
        expect(updateStreamInfo).toHaveBeenCalled();

        (updateStreamInfo as jest.Mock).mockClear();
        mockInput.commandArgs = [testPreset, 'some title'];
        await streamPreset(mockInput);
        expect(updateStreamInfo).toHaveBeenCalled();
    });

    test('does not update if preset is wrong', async () => {
        mockInput.client.say = jest.fn();
        mockInput.commandArgs = ['zxncvijnaisdjfn'];
        await streamPreset(mockInput);
        expect(updateStreamInfo).not.toHaveBeenCalled();
    });

});
