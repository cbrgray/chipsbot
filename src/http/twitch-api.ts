import { RequestOptions } from 'https';
import { AuthStoreRecord, getUserRecord, upsertUserRecord } from '../data-access/auth-store';
import { UnauthorizedError } from './unauthorized-error';
import { httpsRequest } from './request';

export { getAuthUrl, newAuthToken, getStreamInfo, updateStreamInfo };


const TWITCH_CLIENT_ID: string = 'fl4pj021zt2bm1ydiip7c7dv5np0tj';
const TWITCH_CLIENT_SECRET: string = process.env.CLIENT_SECRET;
const TWITCH_REDIRECT_URI: string = 'http://localhost'; // aint got me own domain

async function setAuthForUser(userData: AuthStoreRecord) {
    if (userData.userId == null) {
        try {
            userData.userId = await getUserId(userData.username, userData.accessToken);
        } catch (e) {
            throw new Error(`Failed to fetch user ID for ${userData.username}`);
        }
    }
    
    upsertUserRecord(userData);
}

function getAuthUrl(scope: string = 'user:edit:broadcast'): string {
    return new URL(`https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${TWITCH_CLIENT_ID}&redirect_uri=${TWITCH_REDIRECT_URI}&scope=${scope}`).toString();
}

async function getUserId(channel: string, accessToken: string): Promise<number> {
    const options: RequestOptions = {
        host: 'api.twitch.tv',
        path: `/helix/users?login=${channel}`,
        method: 'GET',
        headers: { 'Client-Id': TWITCH_CLIENT_ID, 'Authorization': `Bearer ${accessToken}` },
    };
    const response: any = await httpsRequest(options);
    return response.data[0].id;
}

async function getGameId(gameTitle: string, accessToken: string): Promise<string> {
    const options: RequestOptions = {
        host: 'api.twitch.tv',
        path: `/helix/games?name=${encodeURIComponent(gameTitle)}`,
        method: 'GET',
        headers: { 'Client-Id': TWITCH_CLIENT_ID, 'Authorization': `Bearer ${accessToken}` },
    };
    const response: any = await httpsRequest(options);
    return response.data[0].id;
}

async function newAuthToken(username: string, code: string) {
    const options: RequestOptions = {
        host: 'id.twitch.tv',
        path: `/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&redirect_uri=${TWITCH_REDIRECT_URI}&code=${code}&grant_type=authorization_code`,
        method: 'POST',
    };
    const response: any = await httpsRequest(options);
    await setAuthForUser({ username: username, accessToken: response.access_token, refreshToken: response.refresh_token, userId: null });
}

async function refreshAuthToken(username: string) {
    const userData: AuthStoreRecord = await getUserRecord(username);
    const options: RequestOptions = {
        host: 'id.twitch.tv',
        path: `/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&refresh_token=${userData.refreshToken}&grant_type=refresh_token`,
        method: 'POST',
    };
    const response: any = await httpsRequest(options);
    userData.accessToken = response.access_token;
    userData.refreshToken = response.refresh_token;
    await setAuthForUser(userData);
}

async function getStreamInfo(username: string): Promise<string> {
    return await retryFailedAuth(username, _getStreamInfo, username);
}

async function _getStreamInfo(username: string): Promise<string> {
    const userData: AuthStoreRecord = await getUserRecord(username);
    const options: RequestOptions = {
        host: 'api.twitch.tv',
        path: `/helix/channels?broadcaster_id=${userData.userId}`,
        method: 'GET',
        headers: { 'Client-Id': TWITCH_CLIENT_ID, 'Authorization': `Bearer ${userData.accessToken}` },
    };
    
    const response: any = await httpsRequest(options);
    const r: any = response.data[0];
    return `${r.title} - ${r.game_name}`;
}

async function updateStreamInfo(username: string, newGame: string, newTitle: string): Promise<void> {
    await retryFailedAuth(username, _updateStreamInfo, username, newGame, newTitle);
}

async function _updateStreamInfo(username: string, newGame: string, newTitle: string): Promise<void> {
    const userData: AuthStoreRecord = await getUserRecord(username);
    const options: RequestOptions = {
        host: 'api.twitch.tv',
        path: `/helix/channels?broadcaster_id=${userData.userId}`,
        method: 'PATCH',
        headers: { 'Client-Id': TWITCH_CLIENT_ID, 'Content-Type': 'application/json', 'Authorization': `Bearer ${userData.accessToken}` },
    };
    
    let newInfo: string[] = [];
    
    if (newGame) {
        try {
            const newGameId = await getGameId(newGame, userData.accessToken);
            newInfo.push(`"game_id":"${newGameId}"`);
        } catch (e) {
            console.error(`Failed to fetch game ID for ${newGame}`);
            throw e;
        }
    }
    if (newTitle) {
        newInfo.push(`"title":"${newTitle}"`);
    }

    const postData: string = '{' + newInfo.join(',') + '}';
    await httpsRequest(options, postData);
}

async function retryFailedAuth<T, Q extends any[]>(username: string, func: (...args: Q) => Promise<T>, ...funcArgs: Q): Promise<T> {
    try {
        return await func(...funcArgs);
    } catch (err) {
        if (err instanceof UnauthorizedError) {
            console.log(`Calling function failed due to 401 unauthorized, retrying once after recovery`);
            return refreshAuthToken(username).then(() => func(...funcArgs));
        } else {
            throw err;
        }
    } 
}
