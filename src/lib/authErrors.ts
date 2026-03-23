export class AuthHttpError extends Error {
    constructor(
        public readonly status: number,
        public readonly code: string,
        message: string,
        public readonly field?: string
    ) {
        super(message);
        this.name = 'AuthHttpError';
    }
}
