import * as quotes from '../../data-access/quotation';
import { CmdInput } from '../../irc/chat-command';
import { formatDate } from '../../util';


export async function quote(input: CmdInput) {
    const record = await quotes.getQuotation(parseInt(input.commandArgs[0]) || null);
    const date = record.customDate != null ? record.customDate : formatDate(record.date);
    const quote: string = `#${record.index} "${record.quotation}" -${record.person}${date ? ', '+date : ''}`;
    input.client.say(input.channel, quote);
    input.chatRelays.reverseBroadcast(input.channel, quote);
}

export async function addQuote(input: CmdInput) {
    if (input.commandArgs.length <= 1 || input.commandArgs.length >= 4) {
        input.client.say(input.channel, 'Invalid args');
        return;
    }

    let potentialDate: Date = new Date(input.commandArgs[2]);
    let record: quotes.QuotationRecord = { quotation: input.commandArgs[0], person: input.commandArgs[1], date: potentialDate };

    if (input.commandArgs.length === 3) {
        record.date = new Date(input.commandArgs[2]);
        if (isNaN(potentialDate.getTime())) {
            record.date = new Date();
            record.customDate = input.commandArgs[2];
        }
    } else {
        record.date = new Date();
    }

    const newQuoteNum: number = await quotes.insertQuotation(record);
    input.client.say(input.channel, `Quotation #${newQuoteNum} added`);
}

export async function modifyQuote(input: CmdInput) {
    if (input.commandArgs.length <= 2 || input.commandArgs.length >= 5) {
        input.client.say(input.channel, 'Invalid args');
        return;
    }

    let potentialDate: Date = new Date(input.commandArgs[3]);
    let record: quotes.QuotationRecord = { index: parseInt(input.commandArgs[0]), quotation: input.commandArgs[1], person: input.commandArgs[2], date: potentialDate };

    if (input.commandArgs.length === 4 && isNaN(potentialDate.getTime())) {
        record.date = new Date();
        record.customDate = input.commandArgs[3];
    }

    await quotes.updateQuotation(record);
    input.client.say(input.channel, `Quotation #${input.commandArgs[0]} updated`);
}
