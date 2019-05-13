declare class Gusk {
    private host;
    private ssl;
    RetryShipments: boolean;
    ws: WebSocket;
    WaitingTimeForRetry: number;
    private socketEvents;
    private messageIntervalos;
    private conectado;
    private FailedShipments;
    private URI;
    private ID;
    constructor(host: string, ssl: boolean);
    private setURI;
    /**
     * GetID
     */
    GetID(): string;
    private defaultChanelForCFG;
    /**
     * Connect
     */
    Connect(): void;
    ForceClosed(): void;
    private retryShipmentsFunction;
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
    private SetOnMessage;
    private getSocketFuntion;
    /**
     * Send
     */
    SendMessage(EventName: string, Data: string): void;
    /**
     * SendMessageSk
     */
    SendMessageSk(message: SocketMessage): void;
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
