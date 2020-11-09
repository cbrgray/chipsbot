const callResponses: Map<string, string> = new Map();
callResponses.set('shizze', 'shizze play outlast OneHand');
callResponses.set('krat', 'http://krat.club/ yes yes yes');

export function getCallResponse(message: string): string {
    callResponses.forEach((key, val) => {
        if (message.toLowerCase().includes(key)) {
            return val; // just take the first identifier found, in case there are multiple in one message
        }
    });
    return '';
}
