import { getAuthUrl } from '../../src/http/twitch-api';


describe('getAuthUrl', () => {

    test('produces a valid URL', () => {
        let url: URL = new URL(getAuthUrl());
        expect(url).toBeDefined();
    });

});
