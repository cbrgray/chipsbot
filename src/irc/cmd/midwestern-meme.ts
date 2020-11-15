import { CmdInput } from '../chat-command';
import { CommonReq } from '../../http/request';


export async function getRandomRedditPost(input: CmdInput) {
    const response: any = await CommonReq.fetch(new URL('https://www.reddit.com/r/MidwesternMemes/random.json'));
    const dataItem: any = response[0].data.children[0].data;
    input.client.say(input.channel, `${dataItem.title}: ${dataItem.url}`);
}
