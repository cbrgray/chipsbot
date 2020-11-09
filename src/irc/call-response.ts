const callResponses: Map<string, string> = new Map()
    .set('shizze', 'shizze play outlast OneHand')
    .set('krat', 'http://krat.club/ yes yes yes');

export function getCallResponse(message: string): string {
    let result: string = '';
    callResponses.forEach((val, key) => {
        if (message.toLowerCase().includes(key)) {
            result = val; // just take the first identifier found, in case there are multiple in one message
        }
    });
    return result;
}
