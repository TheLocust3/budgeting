/// <reference types="node" />
declare const endpoint: (request: import("http").IncomingMessage & {
    url: string;
}, response: import("http").ServerResponse & {
    json?: ((data: unknown) => void) | undefined;
}) => Promise<void>;
export default endpoint;
