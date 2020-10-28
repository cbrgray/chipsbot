export class Util {

    constructor() {}

    public static charCount(text: string, char: string): number { // avoids the memory overhead of .split()
        let count: number = 0;
        for (let c of text) {
            if (c === char) {
                count++;
            }
        }
        return count;
    }

}
