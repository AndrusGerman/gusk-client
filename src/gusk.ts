class Gusk {
    // Publics Vars
    public RetryShipments = false;
    private ws: WebSocket;
    public WaitingTimeForRetry = 1500;
    public MaxRetryConnection = 5;
    public OnClose = () => { };
    public OnOpen = () => { };
    private RetryConnectionCount = 0;
    public RetryConnection = true;
    private ManualDisconection = false;
    // Varibles
    private socketEvents: SocketEventArrayModel[] = new Array;
    private messageIntervalos: number[] = new Array;
    private conectado = false;
    private FailedShipments: SocketMessage[] = new Array;
    private URI: string;
    private Client = new Client;
    // Constructor
    constructor(
        private host: string,
        private ssl: boolean,
    ) {
        this.URI = CreateURI(host, ssl);
        this.EvenyCFG();
    }
    /**
     * GetID
     */
    public ID() {
        return this.Client.ID;
    }
    /**
     * Connect
     */
    public Connect() {
        if (this.conectado) { return; };
        this.ws = new WebSocket(this.URI);
        this.ws.onclose = (ev) => { this.OnCloseGusk(); };
        this.ws.onopen = (ev) => { this.OnOpenGusk(); };
    }
    /**
     * ConnectRetry
     */
    private ConnectRetry() {
        this.ws.close();
        if (this.RetryConnection == false || this.ManualDisconection == true) {
            this.RetryConnectionCount = 0;
            return;
        }
        // Check retry connection count
        this.RetryConnectionCount++
        if (this.RetryConnectionCount == this.MaxRetryConnection) {
            this.ManualDisconection = true;
            this.RetryConnectionCount = 0;
            console.log('GUSK: Max retry connection...');
            return
        }
        console.log('GUSK: Reconectando...');
        this.Connect();
    }
    // Closed Server
    public ForceClosed() {
        this.ManualDisconection = true;
        this.Client.Reset();
        this.conectado = false;
        this.RetryConnectionCount = 0;
        this.messageIntervalos.forEach(val => {
            clearInterval(val);
        });
        this.ws.close();
    }
    // retryShipmentsFunction Send Failid message
    private retryShipmentsFunction() {
        if (!this.RetryShipments) { return; };
        for (let ind = 0; ind < this.FailedShipments.length; ind++) {
            const element = this.FailedShipments[ind];
            this.SendSk(element);
        }
        this.FailedShipments = new Array;
    }
    /**
     * Closed
     */
    public Close() {
        this.RetryConnectionCount = 0;
        this.ManualDisconection = true;
        if (this.conectado) {
            this.SendSk(new SocketMessage('cfg', { 'Mode': ModeServer.CloseGusk }));
        } else {
            console.log('GUSK-CLIENT-LOG: Error Not connect');
        }
    }

    private OnOpenGusk() {
        this.ManualDisconection = false;
        this.conectado = true;
        this.SetOnMessage();
        this.SetConfiguration();
        this.OnOpen();
    }
    /**
     * completeConfiguration
     */
    public onCompleteConfiguration() {
        this.retryShipmentsFunction()
    }
    private OnCloseGusk() {
        this.conectado = false;
        setTimeout(() => {
            this.ConnectRetry();
        }, this.WaitingTimeForRetry);
        this.OnClose();
    }
    private SetConfiguration() {
        if (!this.Client.Data) {
            console.log('GUSK-CLIENT-LOG: New Configuration');
            this.SendSk(new SocketMessage('cfg', { 'Mode': ModeServer.GetConfiguration }));
        } else {
            console.log('GUSK-CLIENT-LOG: Set Old Configuration');
            this.SendSk(new SocketMessage('cfg', { 'Mode': ModeServer.SetConfigurationReconection, 'Data': { 'ID': this.Client.ID } }));
            this.onCompleteConfiguration();
        }
    }
    /**
     * Event
     */
    public Event(EventName: string, EventFuntion: ((Data: any) => void)) {
        this.socketEvents.push(
            new SocketEventArrayModel(EventName, EventFuntion)
        )
    }
    /**
     * Init
     */
    private SetOnMessage() {
        this.ws.onmessage = (event) => {
            let resp = JSON.parse(event.data);
            this.getSocketFuntion(resp.Event)(resp.Data);
        }
    }
    private getSocketFuntion(EventName: string): (Data) => void {
        for (let ind = 0; ind < this.socketEvents.length; ind++) {
            if (EventName == this.socketEvents[ind].EventName) {
                return this.socketEvents[ind].Func;
            }
        }
        return ((Data) => { console.log(`GUSK-CLIENT-LOG: Event '${EventName}' not Found`) })
    }
    private EvenyCFG() {
        this.Event('cfg', (val) => {
            switch (val.Mode) {
                case ModeClient.SetConfiguration:
                    this.Client.SetID(val.Data);
                    this.onCompleteConfiguration();
                    break;
                case ModeClient.Log:
                    console.log(`GUSK-SERVER-LOG: ${val.Data}`);
                    break
                case ModeClient.CloseGusk:
                    this.ManualDisconection = true;
                    console.log(`GUSK-CLIENT-LOG: Finish connection`);
                    this.ForceClosed();
                    break
                default:
                    console.log(`GUSK-CLIENT-LOG: Mode "${val.Mode}" not found`);
                    break;
            }
        })
    }
    /**
     * Send
     */
    public Send(EventName: string, Data: string) {
        this.SendSk(new SocketMessage(EventName, Data));
    }
    /**
     * SendMessageSk
     */
    public SendSk(message: SocketMessage) {
        if (this.conectado) {
            let en = JSON.stringify(message);
            this.ws.send(en);
        } else {
            if (!this.RetryShipments) { return; };
            this.FailedShipments.push(message);
        }
    }
    /**
     * SendInterval
     */
    public SendInterval(data: SocketMessage, time: number): () => void {
        let closeID = setInterval(() => {
            this.SendSk(data);
        }, time)
        this.messageIntervalos.push(closeID);
        return () => {
            clearInterval(closeID);
            let ind = this.messageIntervalos.indexOf(closeID);
            this.messageIntervalos.splice(ind, 1);
        }
    }
}

class SocketEventArrayModel {
    constructor(public EventName: string, public Func: ((Data: any) => void)) { }
}
class SocketMessage {
    public Date: number;
    constructor(
        public Event: string,
        public Data: any,
    ) {
    }
}

class Client {
    Data: boolean = false;
    ID: string = '';
    /**
     * SetID
     */
    public SetID(ID: string) {
        this.Data = true;
        this.ID = ID;
    }
    /**
     * Reset
     */
    public Reset() {
        this.Data = false
        this.ID = '';
    }
}

const ModeServer = {
    CloseGusk: "client->server:close-gusk",
    GetConfiguration: "client->server:get-configuration",
    SetConfigurationReconection: "client->server:set-configuration-reconection",

}
const ModeClient = {
    Log: "server->client:log",
    SetConfiguration: "server->client:set-configuration",
    CloseGusk: "server->client:close-gusk",
}
function CreateURI(host: string, ssl: boolean): string {
    let URI = ''
    if (ssl) {
        URI = 'wss:'
    } else {
        URI = 'ws:';
    }
    URI += '//' + host;
    return URI
}


console.log('GUSK: Welcome to Gusk');