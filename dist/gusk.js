var Gusk = /** @class */ (function () {
    // Constructor
    function Gusk(host, ssl) {
        this.host = host;
        this.ssl = ssl;
        // Publics Vars
        this.RetryShipments = false;
        this.WaitingTimeForRetry = 800;
        // Varibles
        this.socketEvents = new Array;
        this.messageIntervalos = new Array;
        this.conectado = false;
        this.FailedShipments = new Array;
        this.ID = '';
        this.setURI();
        this.defaultChanelForCFG();
    }
    Gusk.prototype.setURI = function () {
        this.URI = 'ws:';
        if (this.ssl) {
            this.URI = 'wss:';
        }
        this.URI += '//' + this.host;
    };
    /**
     * GetID
     */
    Gusk.prototype.GetID = function () {
        return this.ID;
    };
    Gusk.prototype.defaultChanelForCFG = function () {
        var _this = this;
        console.log('GUSK: Welcome to Gusk');
        this.OnEvent('cfg', function (val) {
            switch (val.Mode) {
                case 'set-configuration':
                    console.log("GUSK-CLIENT-LOG: ID='" + val.Data + "'");
                    _this.ID = val.Data;
                    break;
                case 'server-log':
                    console.log("GUSK-SERVER-LOG: " + val.Data);
                    break;
                case 'close-configuration':
                    console.log("GUSK-CLIENT-LOG: Finish");
                    _this.ForceClosed();
                    break;
                default:
                    console.log("GUSK-CLIENT-LOG: Mode \"" + val.Mode + "\" not found");
                    break;
            }
        });
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
        this.ws.onclose = function (ev) { _this.onclose(); };
        this.ws.onopen = function (ev) { _this.onopen(); };
    };
    // Closed Server
    Gusk.prototype.ForceClosed = function () {
        this.ws.onclose = function (ev) { };
        this.ID = '';
        this.messageIntervalos.forEach(function (val) {
            clearInterval(val);
        });
        this.ws.close();
    };
    // Send Failid message
    Gusk.prototype.retryShipmentsFunction = function () {
        if (!this.RetryShipments) {
            return;
        }
        ;
        for (var ind = 0; ind < this.FailedShipments.length; ind++) {
            var element = this.FailedShipments[ind];
            this.SendMessageSk(element);
        }
        this.FailedShipments = new Array;
    };
    /**
     * Closed
     */
    Gusk.prototype.Close = function () {
        this.SendMessageSk(new SocketMessage('cfg', { 'Mode': 'close-server' }));
    };
    Gusk.prototype.onopen = function () {
        console.log('GUSK: Conectado');
        this.conectado = true;
        this.SetOnMessage();
        this.SetConfiguration();
    };
    Gusk.prototype.onclose = function () {
        var _this = this;
        this.conectado = false;
        setTimeout(function () {
            console.log('GUSK: Reconectando...');
            _this.Connect();
        }, this.WaitingTimeForRetry);
    };
    Gusk.prototype.SetConfiguration = function () {
        if (this.ID == '') {
            console.log('GUSK-CLIENT-LOG: New Configuration');
            this.SendMessageSk(new SocketMessage('cfg', { 'Mode': 'get-configuration-server' }));
        }
        else {
            console.log('GUSK-CLIENT-LOG: Set Old Configuration');
            this.SendMessageSk(new SocketMessage('cfg', { 'Mode': 'set-configuration-server', 'Data': this.ID }));
        }
    };
    /**
     * OnEvent
     */
    Gusk.prototype.OnEvent = function (EventName, EventFuntion) {
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
    /**
     * Send
     */
    Gusk.prototype.SendMessage = function (EventName, Data) {
        this.SendMessageSk(new SocketMessage(EventName, Data));
    };
    /**
     * SendMessageSk
     */
    Gusk.prototype.SendMessageSk = function (message) {
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
            _this.SendMessageSk(data);
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
