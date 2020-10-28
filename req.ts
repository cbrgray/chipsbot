import { request, RequestOptions } from 'https';
import { ClientRequest } from 'http';
import { UnauthorizedError } from './unauthorized-error';
import { File } from './file';

export { getAuthUrl, newAuthToken, getStreamInfo, updateStreamInfo };


const TWITCH_CLIENT_ID: string = 'fl4pj021zt2bm1ydiip7c7dv5np0tj';
const TWITCH_CLIENT_SECRET: string = process.env.CLIENT_SECRET;
const TWITCH_REDIRECT_URI: string = 'http://localhost'; // aint got me own domain

const authStore: File = new File('authstore');

function encodeAuthStore(username: string, accessToken: string, refreshToken: string, userId: string = ''): string {
    return `${username}:${userId},${accessToken},${refreshToken}`;
}

type AuthStoreRecord = { username: string, userId: string, accessToken: string, refreshToken: string };

function decodeAuthStore(username: string): AuthStoreRecord {
    const data: string[][] = authStore.readLines().map(p => p.split(':'));
    const userData: string[] = data.find(p => p[0] === username);
    if (!userData) {
        throw new Error(`Could not retrieve authstore data for user ${username}`);
    }
    const userDataFields: string[] = userData[1].split(',');
    return { username: username, userId: userDataFields[0], accessToken: userDataFields[1], refreshToken: userDataFields[2] };
}

async function setAuthForUser(username: string, accessToken: string, refreshToken: string) {
    let userData: AuthStoreRecord = decodeAuthStore(username);
    userData.accessToken = accessToken;
    userData.refreshToken = refreshToken;

    try {
        userData.userId = await getUserId(username, userData.accessToken);
    } catch (e) {
        throw new Error(`Failed to fetch user ID for ${username}`);
    }
    
    const writeData: string = encodeAuthStore(userData.username, userData.accessToken, userData.refreshToken, userData.userId);
    authStore.write(writeData);
}

function getAuthUrl(scope: string = 'user:edit:broadcast'): string {
    return `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${TWITCH_CLIENT_ID}&redirect_uri=${TWITCH_REDIRECT_URI}&scope=${scope}`;
}

async function getUserId(channel: string, accessToken: string): Promise<string> {
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
    await setAuthForUser(username, response.access_token, response.refresh_token);
}

async function refreshAuthToken(username: string) {
    const userData: AuthStoreRecord = decodeAuthStore(username);
    const options: RequestOptions = {
        host: 'id.twitch.tv',
        path: `/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&refresh_token=${userData.refreshToken}&grant_type=refresh_token`,
        method: 'POST',
    };
    const response: any = await httpsRequest(options);
    await setAuthForUser(username, response.access_token, response.refresh_token);
}

async function getStreamInfo(username: string): Promise<string> {
    return await retryFailedAuth(username, _getStreamInfo, [username]);
}

async function _getStreamInfo(username: string): Promise<string> {
    const userData: AuthStoreRecord = decodeAuthStore(username);
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

async function updateStreamInfo(username: string, newGame: string, newTitle: string) {
    await retryFailedAuth(username, _updateStreamInfo, [username, newGame, newTitle]);
}

async function _updateStreamInfo(username: string, newGame: string, newTitle: string) {
    const userData: AuthStoreRecord = decodeAuthStore(username);
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
            console.error(e.message);
            throw new Error(`Failed to fetch game ID for ${newGame}`);
        }
    }
    if (newTitle) {
        newInfo.push(`"title":"${newTitle}"`);
    }

    const postData: string = '{' + newInfo.join(',') + '}';
    await httpsRequest(options, postData);
}

function retryFailedAuth(username: string, func: Function, funcArgs: any[]) {
    return func(...funcArgs).catch(err => {
        if (err instanceof UnauthorizedError) {
            console.log(`Calling function failed due to 401 unauthorized, retrying once after recovery`);
            return refreshAuthToken(username).then(() => func(...funcArgs));
        } else {
            throw err; // cant throw in catch?
        }
    }); 
}

function httpsRequest(params: RequestOptions, postData?: string) {
    return new Promise((resolve, reject) => {
        let req: ClientRequest = request(params, (res) => {
            if (res.statusCode === 401) {
                return reject(new UnauthorizedError());
            }
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error(`${res.statusCode}, ${res.statusMessage}`));
            }
            
            // on response data, cumulate it
            let body: any[] = [];
            res.on('data', (chunk) => body.push(chunk));
            
            // on end, parse and resolve
            res.on('end', () => {
                try {
                    if (body.length) {
                        body = JSON.parse(Buffer.concat(body).toString());
                    }
                } catch(e) {
                    reject(e);
                }
                resolve(body);
            });
        });
        
        req.on('error', (err) => reject(err));
        
        // if there's post data, write it to the request
        if (postData) {
            req.write(postData);
        }
        
        req.end();
    });
}
