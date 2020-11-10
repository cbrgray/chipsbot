import { File } from '../../data-access/file';
import { CmdInput } from '../../irc/chat-command';
import { CommonReq } from '../../http/request';


const PUBLIC_JEVON_URL: string = 'https://dl.dropboxusercontent.com/s/rtmkmps94lxplo7/jvn.txt?dl=0';
const jevonFile: File = new File('jvn.txt');

(async function fetchJevonData() {
    if (!jevonFile.read()) {
        let data: string = await CommonReq.fetch(new URL(PUBLIC_JEVON_URL));
        jevonFile.write(data);
    }
})();

export function jevon(input: CmdInput) {
    const lines: string[] = jevonFile.readLines();
    
    const forename: string[] = lines[0].split(',');
    const surname1: string[] = lines[1].split(',');
    const surname2: string[] = lines[2].split(',');
    
    const randomIndex0: number = Math.floor(Math.random() * forename.length);
    const randomIndex1: number = Math.floor(Math.random() * surname1.length);
    const randomIndex2: number = Math.floor(Math.random() * surname2.length);

    const fullName = `${forename[randomIndex0]} ${surname1[randomIndex1]}${surname2[randomIndex2]}`;
    input.client.say(input.channel, fullName);
    input.chatRelays.reverseBroadcast(input.channel, fullName);
}

export async function jevonOdds(input: CmdInput) {
    const lines: string[] = jevonFile.readLines();
    const odds: number = lines.reduce((acc, cur) => cur.split(',').length * acc, 1);
    const oddsString = `There are currently ${odds.toLocaleString()} possible !jevon combinations`;
    input.client.say(input.channel, oddsString);
    input.chatRelays.reverseBroadcast(input.channel, oddsString);
}
