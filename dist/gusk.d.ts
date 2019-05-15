declare class Gusk {
    private host;
    private ssl;
    RetryShipments: boolean;
    private ws;
    WaitingTimeForRetry: number;
    MaxRetryConnection: number;
    OnClose: () => void;
    OnOpen: () => void;
    private RetryConnectionCount;
    RetryConnection: boolean;
    private ManualDisconection;
    private socketEvents;
    private messageIntervalos;
    private conectado;
    private FailedShipments;
    private URI;
    private Client;
    constructor(host: string, ssl: boolean);
    /**
     * GetID
     */
    ID(): string;
    /**
     * Connect
     */
    Connect(): void;
    /**
     * ConnectRetry
     */
    private ConnectRetry;
    ForceClosed(): void;
    private retryShipmentsFunction;
    /**
     * Closed
     */
    Close(): void;
    private OnOpenGusk;
    /**
     * completeConfiguration
     */
    onCompleteConfiguration(): void;
    private OnCloseGusk;
    private SetConfiguration;
    /**
     * Event
     */
    Event(EventName: string, EventFuntion: ((Data: any) => void)): void;
    /**
     * Init
     */
    private SetOnMessage;
    private getSocketFuntion;
    private EvenyCFG;
    /**
     * Send
     */
    Send(EventName: string, Data: string): void;
    /**
     * SendMessageSk
     */
    SendSk(message: SocketMessage): void;
    /**
     * SendInterval
     */
    SendInterval(data: SocketMessage, time: number): () => void;
}
declare class SocketEventArrayModel {
    EventName: string;
    Func: ((Data: any) => void);
    constructor(EventName: string, Func: ((Data: any) => void));
}
declare class SocketMessage {
    Event: string;
    Data: any;
    Date: number;
    constructor(Event: string, Data: any);
}
declare class Client {
    Data: boolean;
    ID: string;
    /**
     * SetID
     */
    SetID(ID: string): void;
    /**
     * Reset
     */
    Reset(): void;
}
declare const ModeServer: {
    CloseGusk: string;
    GetConfiguration: string;
    SetConfigurationReconection: string;
};
declare const ModeClient: {
    Log: string;
    SetConfiguration: string;
    CloseGusk: string;
};
declare function CreateURI(host: string, ssl: boolean): string;
