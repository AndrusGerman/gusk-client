class Gusk {
    // Publics Vars
    public RetryShipments = false;
    public ws: WebSocket;
    public WaitingTimeForRetry = 800;
    // Varibles
    private socketEvents: SocketEventArrayModel[] = new Array;
    private messageIntervalos: number[] = new Array;
    private conectado = false;
    private FailedShipments: SocketMessage[] = new Array;
    private URI: string;
    private ID = '';
    // Constructor
    constructor(
        private host: string,
        private ssl: boolean,
    ) {
        this.setURI()
        this.defaultChanelForCFG();
    }
    private setURI() {
        this.URI = 'ws:';
        if (this.ssl) {
            this.URI = 'wss:'
        }
        this.URI += '//' + this.host;
    }
    /**
     * GetID
     */
    public GetID() {
        return this.ID;
    }
    private defaultChanelForCFG() {
        console.log('GUSK: Welcome to Gusk')
        this.OnEvent('cfg', (val) => {
            switch (val.Mode) {
                case 'set-configuration':
                    console.log(`GUSK-CLIENT-LOG: ID='${val.Data}'`);
                    this.ID = val.Data;
                    break;
                case 'server-log':
                    console.log(`GUSK-SERVER-LOG: ${val.Data}`);
                    break
                case 'close-configuration':
                    console.log(`GUSK-CLIENT-LOG: Finish`);
                    this.ForceClosed();
                    break
                default:
                    console.log(`GUSK-CLIENT-LOG: Mode "${val.Mode}" not found`);
                    break;
            }
        })
    }
    /**
     * Connect
     */
    public Connect() {
        if (this.conectado) { return; };
        this.ws = new WebSocket(this.URI);
        this.ws.onclose = (ev) => { this.onclose(); };
        this.ws.onopen = (ev) => { this.onopen(); };
    }
    // Closed Server
    public ForceClosed() {
        this.ws.onclose = (ev) => { };
        this.ID = '';
        this.messageIntervalos.forEach(val => {
            clearInterval(val);
        });
        this.ws.close();
    }
    // Send Failid message
    private retryShipmentsFunction() {
        if (!this.RetryShipments) { return; };
        for (let ind = 0; ind < this.FailedShipments.length; ind++) {
            const element = this.FailedShipments[ind];
            this.SendMessageSk(element);
        }
        this.FailedShipments = new Array;
    }
    /**
     * Closed
     */
    public Close() {
        this.SendMessageSk(new SocketMessage('cfg', { 'Mode': 'close-server' }));
    }
    private onopen() {
        console.log('GUSK: Conectado');
        this.conectado = true;
        this.SetOnMessage();
        this.SetConfiguration();
    }
    private onclose() {
        this.conectado = false;
        setTimeout(() => {
            console.log('GUSK: Reconectando...');
            this.Connect();
        }, this.WaitingTimeForRetry);
    }
    private SetConfiguration() {
        if (this.ID == '') {
            console.log('GUSK-CLIENT-LOG: New Configuration');
            this.SendMessageSk(new SocketMessage('cfg', { 'Mode': 'get-configuration-server' }));
        } else {
            console.log('GUSK-CLIENT-LOG: Set Old Configuration');
            this.SendMessageSk(new SocketMessage('cfg', { 'Mode': 'set-configuration-server', 'Data': this.ID }));
        }
    }
    /**
     * OnEvent
     */
    public OnEvent(EventName: string, EventFuntion: ((Data: any) => void)) {
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
    /**
     * Send
     */
    public SendMessage(EventName: string, Data: string) {
        this.SendMessageSk(new SocketMessage(EventName, Data));
    }
    /**
     * SendMessageSk
     */
    public SendMessageSk(message: SocketMessage) {
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
            this.SendMessageSk(data);
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
    constructor(public EventName: string, public Func: ((Data: string) => void)) { }
}
class SocketMessage {
    constructor(
        public Event: string,
        public Data: any,
    ) { }
}