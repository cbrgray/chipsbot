export class UnauthorizedError extends Error {
    public name: string = '';

    constructor(...params: any[]) {
        super(...params);

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, UnauthorizedError);
        }

        this.name = 'UnauthorizedError';
        if (!this.message) {
            this.message = 'Unauthorised';
        }
    }
    
}
