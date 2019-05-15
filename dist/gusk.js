var Gusk = /** @class */ (function () {
    // Constructor
    function Gusk(host, ssl) {
        this.host = host;
        this.ssl = ssl;
        // Publics Vars
        this.RetryShipments = false;
        this.WaitingTimeForRetry = 1500;
        this.MaxRetryConnection = 5;
        this.OnClose = function () { };
        this.OnOpen = function () { };
        this.RetryConnectionCount = 0;
        this.RetryConnection = true;
        this.ManualDisconection = false;
        // Varibles
        this.socketEvents = new Array;
        this.messageIntervalos = new Array;
        this.conectado = false;
        this.FailedShipments = new Array;
        this.Client = new Client;
        this.URI = CreateURI(host, ssl);
        this.EvenyCFG();
    }
    /**
     * GetID
     */
    Gusk.prototype.ID = function () {
        return this.Client.ID;
    };
    /**
     * Connect
     */
    Gusk.prototype.Connect = function () {
        var _this = this;
        if (this.conectado) {
            return;
        }
        ;
        this.ws = new WebSocket(this.URI);
        this.ws.onclose = function (ev) { _this.OnCloseGusk(); };
        this.ws.onopen = function (ev) { _this.OnOpenGusk(); };
    };
    /**
     * ConnectRetry
     */
    Gusk.prototype.ConnectRetry = function () {
        this.ws.close();
        if (this.RetryConnection == false || this.ManualDisconection == true) {
            this.RetryConnectionCount = 0;
            return;
        }
        // Check retry connection count
        this.RetryConnectionCount++;
        if (this.RetryConnectionCount == this.MaxRetryConnection) {
            this.ManualDisconection = true;
            this.RetryConnectionCount = 0;
            console.log('GUSK: Max retry connection...');
            return;
        }
        console.log('GUSK: Reconectando...');
        this.Connect();
    };
    // Closed Server
    Gusk.prototype.ForceClosed = function () {
        this.ManualDisconection = true;
        this.Client.Reset();
        this.conectado = false;
        this.RetryConnectionCount = 0;
        this.messageIntervalos.forEach(function (val) {
            clearInterval(val);
        });
        this.ws.close();
    };
    // retryShipmentsFunction Send Failid message
    Gusk.prototype.retryShipmentsFunction = function () {
        if (!this.RetryShipments) {
            return;
        }
        ;
        for (var ind = 0; ind < this.FailedShipments.length; ind++) {
            var element = this.FailedShipments[ind];
            this.SendSk(element);
        }
        this.FailedShipments = new Array;
    };
    /**
     * Closed
     */
    Gusk.prototype.Close = function () {
        this.RetryConnectionCount = 0;
        this.ManualDisconection = true;
        if (this.conectado) {
            this.SendSk(new SocketMessage('cfg', { 'Mode': ModeServer.CloseGusk }));
        }
        else {
            console.log('GUSK-CLIENT-LOG: Error Not connect');
        }
    };
    Gusk.prototype.OnOpenGusk = function () {
        this.ManualDisconection = false;
        this.conectado = true;
        this.SetOnMessage();
        this.SetConfiguration();
        this.OnOpen();
    };
    /**
     * completeConfiguration
     */
    Gusk.prototype.onCompleteConfiguration = function () {
        this.retryShipmentsFunction();
    };
    Gusk.prototype.OnCloseGusk = function () {
        var _this = this;
        this.conectado = false;
        setTimeout(function () {
            _this.ConnectRetry();
        }, this.WaitingTimeForRetry);
        this.OnClose();
    };
    Gusk.prototype.SetConfiguration = function () {
        if (!this.Client.Data) {
            console.log('GUSK-CLIENT-LOG: New Configuration');
            this.SendSk(new SocketMessage('cfg', { 'Mode': ModeServer.GetConfiguration }));
        }
        else {
            console.log('GUSK-CLIENT-LOG: Set Old Configuration');
            this.SendSk(new SocketMessage('cfg', { 'Mode': ModeServer.SetConfigurationReconection, 'Data': { 'ID': this.Client.ID } }));
            this.onCompleteConfiguration();
        }
    };
    /**
     * Event
     */
    Gusk.prototype.Event = function (EventName, EventFuntion) {
        this.socketEvents.push(new SocketEventArrayModel(EventName, EventFuntion));
    };
    /**
     * Init
     */
    Gusk.prototype.SetOnMessage = function () {
        var _this = this;
        this.ws.onmessage = function (event) {
            var resp = JSON.parse(event.data);
            _this.getSocketFuntion(resp.Event)(resp.Data);
        };
    };
    Gusk.prototype.getSocketFuntion = function (EventName) {
        for (var ind = 0; ind < this.socketEvents.length; ind++) {
            if (EventName == this.socketEvents[ind].EventName) {
                return this.socketEvents[ind].Func;
            }
        }
        return (function (Data) { console.log("GUSK-CLIENT-LOG: Event '" + EventName + "' not Found"); });
    };
    Gusk.prototype.EvenyCFG = function () {
        var _this = this;
        this.Event('cfg', function (val) {
            switch (val.Mode) {
                case ModeClient.SetConfiguration:
                    _this.Client.SetID(val.Data);
                    _this.onCompleteConfiguration();
                    break;
                case ModeClient.Log:
                    console.log("GUSK-SERVER-LOG: " + val.Data);
                    break;
                case ModeClient.CloseGusk:
                    _this.ManualDisconection = true;
                    console.log("GUSK-CLIENT-LOG: Finish connection");
                    _this.ForceClosed();
                    break;
                default:
                    console.log("GUSK-CLIENT-LOG: Mode \"" + val.Mode + "\" not found");
                    break;
            }
        });
    };
    /**
     * Send
     */
    Gusk.prototype.Send = function (EventName, Data) {
        this.SendSk(new SocketMessage(EventName, Data));
    };
    /**
     * SendMessageSk
     */
    Gusk.prototype.SendSk = function (message) {
        if (this.conectado) {
            var en = JSON.stringify(message);
            this.ws.send(en);
        }
        else {
            if (!this.RetryShipments) {
                return;
            }
            ;
            this.FailedShipments.push(message);
        }
    };
    /**
     * SendInterval
     */
    Gusk.prototype.SendInterval = function (data, time) {
        var _this = this;
        var closeID = setInterval(function () {
            _this.SendSk(data);
        }, time);
        this.messageIntervalos.push(closeID);
        return function () {
            clearInterval(closeID);
            var ind = _this.messageIntervalos.indexOf(closeID);
            _this.messageIntervalos.splice(ind, 1);
        };
    };
    return Gusk;
}());
var SocketEventArrayModel = /** @class */ (function () {
    function SocketEventArrayModel(EventName, Func) {
        this.EventName = EventName;
        this.Func = Func;
    }
    return SocketEventArrayModel;
}());
var SocketMessage = /** @class */ (function () {
    function SocketMessage(Event, Data) {
        this.Event = Event;
        this.Data = Data;
    }
    return SocketMessage;
}());
var Client = /** @class */ (function () {
    function Client() {
        this.Data = false;
        this.ID = '';
    }
    /**
     * SetID
     */
    Client.prototype.SetID = function (ID) {
        this.Data = true;
        this.ID = ID;
    };
    /**
     * Reset
     */
    Client.prototype.Reset = function () {
        this.Data = false;
        this.ID = '';
    };
    return Client;
}());
var ModeServer = {
    CloseGusk: "client->server:close-gusk",
    GetConfiguration: "client->server:get-configuration",
    SetConfigurationReconection: "client->server:set-configuration-reconection",
};
var ModeClient = {
    Log: "server->client:log",
    SetConfiguration: "server->client:set-configuration",
    CloseGusk: "server->client:close-gusk",
};
function CreateURI(host, ssl) {
    var URI = '';
    if (ssl) {
        URI = 'wss:';
    }
    else {
        URI = 'ws:';
    }
    URI += '//' + host;
    return URI;
}
console.log('GUSK: Welcome to Gusk');
