var Gusk = /** @class */ (function () {
    // Constructor
    function Gusk(host, ssl) {
        this.host = host;
        this.ssl = ssl;
        // Publics Vars
        this.RetryShipments = false;
        this.WaitingTimeForRetry = 700;
        // Varibles
        this.socketEvents = new Array;
        this.messageIntervalos = new Array;
        this.conectado = false;
        this.FailedShipments = new Array;
        this.ID = '';
        this.setURI();
        this.defaultChanel();
    }
    Gusk.prototype.setURI = function () {
        this.uri = 'ws:';
        if (this.ssl) {
            this.uri = 'wss:';
        }
        this.uri += '//' + this.host;
    };
    Gusk.prototype.defaultChanel = function () {
        var _this = this;
        console.log('WS: Welcome to Gusk');
        this.OnEvent('cfg', function (val) {
            switch (val.Mode) {
                case 'set':
                    console.log("CFG: SetID " + val.Data);
                    _this.ID = val.Data;
                    break;
                case 'message':
                    console.log("CFG-SERVER: " + val.Data);
                    break;
                case 'clear-conection':
                    console.log("CFG: Finish");
                    _this.ForceClosed();
                    break;
                default:
                    console.log('CFG: No valido');
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
        this.ws = new WebSocket(this.uri);
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
            this.SendMessage(element);
        }
        this.FailedShipments = new Array;
    };
    /**
     * Closed
     */
    Gusk.prototype.Close = function () {
        this.SendMessage(new SocketMessage('cfg', { 'Mode': 'server-closed' }));
    };
    Gusk.prototype.onopen = function () {
        console.log('WS: Conectado');
        this.conectado = true;
        this.SetOnMessage();
        this.SetConfiguration();
        this.retryShipmentsFunction();
    };
    Gusk.prototype.onclose = function () {
        var _this = this;
        this.conectado = false;
        setTimeout(function () {
            console.log('WS: Reconectando ');
            _this.Connect();
        }, this.WaitingTimeForRetry);
    };
    Gusk.prototype.SetConfiguration = function () {
        if (this.ID == '') {
            console.log('ST: New Configuration');
            this.SendMessage(new SocketMessage('cfg', { 'Mode': 'get' }));
        }
        else {
            console.log('ST: Old Configuration');
            this.SendMessage(new SocketMessage('cfg', { 'Mode': 'set', 'Data': this.ID }));
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
            var element = this.socketEvents[ind];
            if (EventName == element.EventName) {
                return element.Func;
            }
        }
        return (function (string) { });
    };
    /**
     * Send
     */
    Gusk.prototype.SendMessage = function (data) {
        if (this.conectado) {
            var en = JSON.stringify(data);
            this.ws.send(en);
        }
        else {
            if (!this.RetryShipments) {
                return;
            }
            ;
            this.FailedShipments.push(data);
        }
    };
    /**
     * SendInterval
     */
    Gusk.prototype.SendInterval = function (data, time) {
        var _this = this;
        var closeID = setInterval(function () {
            _this.SendMessage(data);
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
