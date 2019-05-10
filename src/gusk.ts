class Gusk {
    // Publics Vars
    public RetryShipments = false;
    public ws: WebSocket;
    public WaitingTimeForRetry = 700;
    // Varibles
    private socketEvents: SocketEventArrayModel[] = new Array;
    private messageIntervalos: number[] = new Array;
    private conectado = false;
    private FailedShipments: SocketMessage[] = new Array;
    private uri: string;
    private ID = '';
    // Constructor
    constructor(
        private host: string,
        private ssl: boolean,
    ) {
        this.setURI()
        this.defaultChanel();
    }
    private setURI() {
        this.uri = 'ws:';
        if (this.ssl) {
            this.uri = 'wss:'
        }
        this.uri += '//' + this.host;
    }
    private defaultChanel() {
        console.log('WS: Welcome to Gusk')
        this.OnEvent('cfg', (val) => {
            switch (val.Mode) {
                case 'set':
                    console.log(`CFG: SetID ${val.Data}`);
                    this.ID = val.Data;
                    break;
                case 'message':
                    console.log(`CFG-SERVER: ${val.Data}`);
                    break
                case 'clear-conection':
                    console.log(`CFG: Finish`);
                    this.ForceClosed();
                    break
                default:
                    console.log('CFG: No valido');
                    break;
            }
        })
    }
    /**
     * Connect
     */
    public Connect() {
        if (this.conectado) { return; };
        this.ws = new WebSocket(this.uri);
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
            this.SendMessage(element);
        }
        this.FailedShipments = new Array;
    }
    /**
     * Closed
     */
    public Close() {
        this.SendMessage(new SocketMessage('cfg', { 'Mode': 'server-closed' }));
    }
    private onopen() {
        console.log('WS: Conectado');
        this.conectado = true;
        this.SetOnMessage();
        this.SetConfiguration();
        this.retryShipmentsFunction();
    }
    private onclose() {
        this.conectado = false;
        setTimeout(() => {
            console.log('WS: Reconectando ');
            this.Connect();
        }, this.WaitingTimeForRetry);
    }
    private SetConfiguration() {
        if (this.ID == '') {
            console.log('ST: New Configuration');
            this.SendMessage(new SocketMessage('cfg', { 'Mode': 'get' }));
        } else {
            console.log('ST: Old Configuration');
            this.SendMessage(new SocketMessage('cfg', { 'Mode': 'set', 'Data': this.ID }));
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
    private getSocketFuntion(EventName: string): (Data: string) => void {
        for (let ind = 0; ind < this.socketEvents.length; ind++) {
            const element = this.socketEvents[ind];
            if (EventName == element.EventName) {
                return element.Func;
            }
        }
        return ((string: string) => { })
    }
    /**
     * Send
     */
    public SendMessage(data: SocketMessage) {
        if (this.conectado) {
            let en = JSON.stringify(data);
            this.ws.send(en);
        } else {
            if (!this.RetryShipments) { return; };
            this.FailedShipments.push(data);
        }
    }
    /**
     * SendInterval
     */
    public SendInterval(data: SocketMessage, time: number): () => void {
        let closeID = setInterval(() => {
            this.SendMessage(data);
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