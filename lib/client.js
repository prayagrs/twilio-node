var sys = require('sys'),
    http = require('http'),
    querystring = require('querystring'),
    express = require('express'),
    Buffer = require('buffer').Buffer;

var API_SERVER = 'api.twilio.com';
var API_VERSION = '2010-04-01';

function Client(sid, authToken, options) {
    if(!(this instanceof Client)) {
        return new Client(sid, authToken, options);
    }

    if(!sid) {
        throw new Error('Client must be passed a SID');
    }

    if(!authToken) {
        throw new Error('Client must be passed an authToken');
    }

    this.sid = sid;
    this.authToken = authToken;
    if(options.hostname) {
        this.hostname = options.hostname;
    }
    this.port = options.port || 31337;
    
    this.basicAuth = (new Buffer(sid + ':' + authToken)).toString('base64');
}

module.exports = Client;

Client.prototype.apiCall = function(method, path, options, suc, err, wholePath) {
    var self = this;

    method = method.toUpperCase();
    options = options || {};
    
    var params = options.params,
        headers = options.headers || {},
        fullPath = '';

    if(params) {
        if(typeof params != 'string') {
            params = querystring.stringify(params);
        }
    }
    
    if(!self.httpClient) {
        self.httpClient = http.createClient(443, API_SERVER, true);
    }
    
    if(wholePath) {
        fullPath = path;
    } else {
        fullPath = '/' + API_VERSION + '/Accounts/' + self.sid;
        if(path.length > 0) {
            if(path[0] != '/') {
                fullPath += '/';
            }
            fullPath += path;
        }
        if(fullPath.substr(fullPath.length - 5) != '.json') {
            fullPath += '.json';
        }
    }

    if(params && method == 'POST') {
        headers['Content-Length'] = params.length;
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
    } else if(params && method == 'GET') {
        fullPath += '?' + params;
    }

    headers.Host = API_SERVER;
    headers.Authorization = "Basic " + self.basicAuth;

    var request = self.httpClient.request(method, fullPath, headers);
    request.on('response', function(response) {
        var responseChunks = [];
        response.setEncoding('utf8');

        response.on('data', function(chunk) {
            responseChunks.push(chunk);
        });

        response.on('end', function() {
            var body = responseChunks.join('');
            
            // Try to deserialize if possible
            try {
                body = JSON.parse(body);
            } catch(err) {
                // Do nothing. Probably wasn't JSON. We'll just return the string.
            }
            typeof suc == 'function' && suc(body);
        });

        if(typeof err == 'function') {
            response.on('error', err);
        }
    });
    
    if(params && method == 'POST') {
        request.write(params);
    }
    request.end();
};

Client.prototype.getAccountInfo = function(suc, err) {
    this.apiCall('GET', '', null, suc, err);
};

// Params may include: FriendlyName
Client.prototype.updateAccountInfo = function(params, suc, err) {
    this.apiCall('POST', '', {params: params}, suc, err);
};

Client.prototype.getSmsInstance = function(messageSid, suc, err) {
    this.apiCall('GET', '/SMS/Messages/' + messageSid, null, suc, err);
};

// Possible filters: To, From, DateSent
Client.prototype.getSmsList = function(filters, suc, err) {
    this.apiCall('GET', '/SMS/Messages', {params: filters}, suc, err);
};

// Required params: From, To, Body
// Optional params: StatusCallback
Client.prototype.sendSms = function(from, to, body, callbackUri, suc, err) {
    if(!from || !to || !body) {
        throw new Error('From, To, and Body argument');
    }
    var params = {
        From: from,
        To: to,
        Body: body
    };
    
    if(callbackUri) {
        params.StatusCallback = callbackUri;
    }
    this.apiCall('POST', '/SMS/Messages', {params: params}, suc, err);
};

// Country can be either 'CA' or 'US' (until Twilio gets more areas serviced)
// Possible filters: AreaCode, Contains, InRegion, InPostalCode, NearLatLong,
// InLata, InRateCenter, Distance
Client.prototype.getAvailableLocalNumbers = function(country, filters, suc, err) {
    if(!country) {
        throw new Error('Country argument required');
    }
    this.apiCall('GET', '/AvailablePhoneNumbers/' + country + '/Local',
                 {params: filters}, suc, err);
};

// Country can be either 'CA' or 'US'
// Possible filters: Contains
Client.prototype.getAvailableTollFreeNumbers = function(country, filters, suc, err) {
    if(!country) {
        throw new Error('Country argument required');
    }
    this.apiCall('GET', '/AvailablePhoneNumbers/' + country + '/Local',
                 {params: filters}, suc, err);
};

Client.prototype.getOutgoingCallerId = function(sid, suc, err) {
    if(!sid) {
        throw new Error('Outgoing SID argument required');
    }
    this.apiCall('GET', '/OutgoingCallerIds/' + sid, null, suc, err);
};

Client.prototype.updateOutgoingCallerId = function(sid, params, suc, err) {
    if(!sid) {
        throw new Error('Outgoing SID argument required');
    }
    this.apiCall('POST', '/OutgoingCallerIds/' + sid, null, suc, err);
};

Client.prototype.deleteOutgoingCallerId = function(sid, suc, err) {
    if(!sid) {
        throw new Error('Outgoing SID argument required');
    }
    this.apiCall('DELETE', '/OutgoingCallerIds/' + sid, null, suc, err);
};

// Possible filters: PhoneNumber, FriendlyName
Client.prototype.getOutgoingCallerIdList = function(filters, suc, err) {
    this.apiCall('GET', '/OutgoingCallerIds', {params: filters}, suc, err);
};

// Add an outgoing caller ID. This will cause Twilio to call the specified
// number to verify it. CallDelay specifies a delay (<=60) for the call.
// Possible params: FriendlyName, CallDelay
Client.prototype.addOutgoingCallerId = function(num, params, suc, err) {
    if(!num) {
        throw new Error('Phone number argument required');
    }
    params = params || {};
    params.PhoneNumber = num;
    
    this.apiCall('POST', '/OutgoingCallerIds', {params: params}, suc, err);
};

// Possible filters: PhoneNumber, FriendlyName
Client.prototype.getIncomingNumbers = function(filters, suc, err) {
    this.apiCall('GET', '/IncomingPhoneNumbers', {params: filters}, suc, err);
};

Client.prototype.getIncomingNumber = function(sid, suc, err) {
    if(!sid) {
        throw new Error('Sid argument required');
    }
    this.apiCall('GET', '/IncomingPhoneNumbers/' + sid, null, suc, err);
};

Client.prototype.updateIncomingNumber = function(sid, params, suc, err) {
    if(!sid) {
        throw new Error('Sid argument required');
    }
    this.apiCall('POST', '/IncomingPhoneNumbers/' + sid, {params: params}, suc, err);
};

Client.prototype.deleteIncomingNumber = function(sid, suc, err) {
    if(!sid) {
        throw new Error('Sid argument required');
    }
    this.apiCall('DELETE', '/IncomingPhoneNumbers/' + sid, null, suc, err);
};

// Possible optional params: FriendlyName, VoiceUrl, VoiceMethod, VoiceFallbackUrl,
// StatusCallback, StatusCallbackMethod, SmsUrl, SmsMethod, SmsFallbackUrl, 
// SmsFallbackMethod, VoiceCallerIdLookup
Client.prototype.provisionIncomingNumber = function(num, areaCode, params, suc, err) {
    params = params || {};
    params.PhoneNumber = num;
    params.AreaCode = areaCode;
    this.apiCall('POST', '/IncomingPhoneNumbers', {params: params}, suc, err);
};

Client.prototype.makeCall = function(from, to, opts, suc, err) {
    opts = opts || {};
    var url = opts.url;
};

/* Returns an actual mp3 or wav */
Client.prototype.getRecording = function(sid, suc, err) {
    if(!sid) {
        throw new Error('Sid argument required');
    }
    this.apiCall('GET', '/Recordings/' + sid, null, suc, err);
};

Client.prototype.deleteRecording = function(sid, suc, err) {
    if(!sid) {
        throw new Error('Sid argument required');
    }
    this.apiCall('DELETE', '/Recordings/' + sid, null, suc, err);
};

Client.prototype.addIncomingCallCallback = function(incomingNumber, callback) {
    var self = this;

    if(!self.expressApp) {
        self.expressApp = express.createServer();
        self.expressApp.listen(self.port);
    }
    
    self.getIncomingNumbers({PhoneNumber: incomingNumber}, function(response) {
        if(!response || !response.incoming_phone_numbers) {
            throw new Error('No such incoming number: ' + incomingNumber);
        }
        var sid = response.incoming_phone_numbers[0].sid;
        var url = 'http://' + self.hostname + ':' + self.port + '/incoming/' + sid;
        self.updateIncomingNumber(sid, {VoiceUrl: url, VoiceMethod: 'POST'}, function(tmp) {
            // All right, the number's all set up for callbacks.
            self.expressApp.post('/incoming/' + sid, callback);
        });
    });
};

Client.prototype.addIncomingSmsCallback = function(incomingNumber, callback) {
    var self = this;

    if(!self.expressApp) {
        self.expressApp = express.createServer();
        self.expressApp.listen(self.port);
    }

    self.getIncomingNumbers({PhoneNumber: incomingNumber}, function(response) {
        if(!response || !response.incoming_phone_numbers) {
            throw new Error('No such incoming number: ' + incomingNumber);
        }
        var sid = response.incoming_phone_numbers[0].sid,
            url = 'http://' + self.hostname + ':' + self.port + '/incoming/' + sid;
        self.updateIncomingNumber(sid, {SmsUrl: url, SmsMethod: 'POST'}, function(tmp) {
            self.expressApp.post('/incoming/' + sid, callback);
        });
    });
};