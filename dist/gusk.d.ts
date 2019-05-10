declare class Gusk {
    private host;
    private ssl;
    private socketEvents;
    private messageIntervalos;
    private conectado;
    ws: WebSocket;
    private uri;
    private ID;
    constructor(host: string, ssl: boolean);
    private setURI;
    private defaultChanel;
    /**
     * Connect
     */
    Connect(): void;
    ForceClosed(): void;
    /**
     * Closed
     */
    Close(): void;
    private onopen;
    private onclose;
    private SetConfiguration;
    /**
     * OnEvent
     */
    OnEvent(EventName: string, EventFuntion: ((Data: any) => void)): void;
    /**
     * Init
     */
    private SetVar;
    private getSocketFuntion;
    /**
     * Send
     */
    SendMessage(data: SocketMessage): void;
    /**
     * SendInterval
     */
    SendInterval(data: SocketMessage, time: number): () => void;
}
declare class SocketEventArrayModel {
    EventName: string;
    Func: ((Data: string) => void);
    constructor(EventName: string, Func: ((Data: string) => void));
}
declare class SocketMessage {
    Event: string;
    Data: any;
    constructor(Event: string, Data: any);
}
