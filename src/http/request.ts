import { ClientRequest } from 'http';
import { RequestOptions, request } from 'https';
import { UnauthorizedError } from '../http/unauthorized-error';


export function httpsRequest(params: RequestOptions, postData?: string) {
    return new Promise((resolve, reject) => {
        let req: ClientRequest = request(params, (res) => {
            if (res.statusCode === 401) {
                return reject(new UnauthorizedError());
            }
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error(`${res.statusCode}, ${res.statusMessage}`));
            }
            
            // on response data, cumulate it
            let respBody: string;
            let body: any[] = [];
            res.on('data', (chunk) => body.push(chunk));
            
            // on end, parse and resolve
            res.on('end', () => {
                try {
                    if (body.length) {
                        respBody = Buffer.concat(body).toString();
                        if (res.headers['content-type'].includes('application/json')) {
                            respBody = JSON.parse(respBody);
                        }
                    }
                } catch(e) {
                    reject(e);
                }
                resolve(respBody);
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

export namespace CommonReq {

    export async function fetch(url: URL) {
        return await request(url, 'GET');
    }

    export async function post(url: URL, headers?: any) {
        return await request(url, 'POST', headers);
    }

    async function request(url: URL, method: string, headers?: any) {
        const options: RequestOptions = {
            host: url.hostname,
            path: `${url.pathname}${url.search}`,
            method: method,
            headers: headers
        };
        const response: any = await httpsRequest(options);
        return response;
    }

}
