function RingBuf(size) {
    this.a = new Array(size);
    this.l = 0;
    this.s = size;
}

RingBuf.InvalidIndex = {};

RingBuf.prototype.get = function(i) {
    if (i < 0)
        throw RingBuf.InvalidIndex;

    return this.a[i % this.a.length];
}

RingBuf.prototype.set = function(i, v) {
    if (i < 0 || i < this.l - this.a.length) {
        throw RingBuf.InvalidIndex;
    }

    this.a[i % this.a.length] = v;
    if (i == this.l)
        this.l++;
}

RingBuf.prototype.push = function(v) {
    if (Array.isArray(v)) {
        let cl = this.l;
        for (let i = 0; i < v.length; i++) {
            this.set(i + cl, v[i]);
        }
    }
    else
        this.set(this.l, v);
}

RingBuf.prototype.slice = function(s) {
    return this.sliceToMax(s, Number.MAX_VALUE);
}

RingBuf.prototype.sliceToMax = function(s, maxReturn) {
    let ret = [];
    let ts = 0;         // Wrap-around OK but don't return more elements than the size of the array
    let max = Math.min(this.a.length, maxReturn);
    if (isNaN(max)) {
        throw new Error("Parameter is not a number");
    }

    for (let i = s; i < this.l && ts < max; i++) {
        ret.push(this.get(i));
        ts++;
    }

    return ret;
}

RingBuf.prototype.clearBuffer = function() {
    delete this.a;
    this.a = new Array(this.s);
    this.l = 0;
}

var logger = new function() {
    this.externalLogger = "";
    this.ringBuf = new RingBuf(1000);
    this.logMarker = 0;

    this.setExternalLogger = function(appId) {
        if (appId != this.externalLogger) {
            this.externalLogger = appId;
            this.sendLogExternal();
        }
    }

    this.timeStamp = function(doMS) {
        // Create a date object with the current time
        var now = new Date();

        var date = [ now.getMonth() + 1, now.getDate(), now.getFullYear() ];
        var time = [ now.getHours(), now.getMinutes(), now.getSeconds() ];
        var time_ms = now.getMilliseconds();

        // If seconds and minutes are less than 10, add a zero
        for (var i = 1; i < 3; i++)
        {
            if (time[i] < 10)
            {
                time[i] = "0" + time[i];
            }
        }

        // Return the formatted string
        var dateTime = date.join("/") + " " + time.join(":");
        if (doMS)
            dateTime += "." + time_ms;

        return dateTime;
    }

    this.logError = function(msg) {
        let ts = this.timeStamp();
        this.logMessageWithTimestamp(ts, msg, "ERROR", console.realError);
    };

    this.logWarning = function(msg) {
        let ts = this.timeStamp();
        this.logMessageWithTimestamp(ts, msg, "WARN", console.realWarn);
    };

    this.logMessage = function(msg) {
        let ts = this.timeStamp();
        this.logMessageWithTimestamp(ts, msg, "INFO", console.realLog);
    };

    this.doLogEntry = function(ts, msg, severity) {
        let logEntry = ts + ": " + msg;
        
        this.ringBuf.push({
            severity: severity,
            date: ts,
            entry: msg
        });

        return logEntry;
    }

    this.clearBuffer = function() {
        this.ringBuf.clearBuffer();
    }

    this.pullBuffer = function(marker) {
        return {
            logMarker: this.ringBuf.l,
            logEntries: this.ringBuf.slice(marker)
        }
    }

    this.sendLogExternal = function() {
        if (this.externalLogger.length > 0) {
            let data = this.pullBuffer(this.logMarker);
            this.logMarker = data.logMarker;
            chrome.runtime.sendMessage(this.externalLogger, { 
                message: "LogEx",
                data: data.logEntries
            });
        }
    }

    this.logMessageWithTimestamp = function(ts, msg, severity, consoleCallback) {
        let logEntry = this.doLogEntry(ts, msg, severity);
    
        if (!consoleCallback) {
            switch (severity) {
                case "INFO": {
                    consoleCallback = console.realLog;
                }
                break;
                case "WARN": {
                    consoleCallback = console.realWarning;
                }
                break;
                case "ERROR": {
                    consoleCallback = console.realError;
                }
                break;
                default: {
                    consoleCallback = console.realLog;
                }
            }
        }

        this.sendLogExternal();

        if (consoleCallback)
            consoleCallback(logEntry);
        else {
            console.realError("NO CONSOLE_CALLBACK: " + logEntry);
        }
    };
}

// Override console log to call our logger
var _log = console.log;
var _error = console.error;
var _warning = console.warn;

console.log = function(msg) {
    logger.logMessage(msg);
};

console.realLog = function(msg) {
    _log.apply(console,arguments);
};

console.warning = function(msg) {
    logger.logWarning(msg);
};

console.realWarning = function(msg) {
    _warning.apply(console,arguments);
}

console.error = function(msg) {
    logger.logError(msg);
};

console.realError = function(msg) {
    _error.apply(console,arguments);
};

