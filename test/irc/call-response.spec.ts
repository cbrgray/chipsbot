import { getCallResponse } from '../../src/irc/call-response';


describe('CallResponse', () => {

    describe('getCallResponse', () => {

        test('returns an empty string in response to an empty message', () => {
            expect(getCallResponse('')).toEqual('');
        });

    });

});
