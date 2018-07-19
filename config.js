"use strict";

var config = {
    allowedHeaders: {
        "Host": true,
        "Connection": true,
        "Content-Length": true,
        "User-Agent": true,
        "Cache-Control": true,
        "Origin": true,
        "Content-Type": true,
        "Accept": true,
        "Accept-Encoding": true,
        "Accept-Language": true,
        "Referer": true,
        "Pragma": true,
        "Cookie": true
    },
    allowedEndpoints: {
        "GET": {
            "^.*?$": false,
            "^\/user\/.*?\/add$": true,
            "^\/user123\/.*?\/add$": true
        },
        "POST": {
            "^.*?$": true,
            "^\/user\/.*?\/add$": true
        }
    },
    targetEndpoints: [
        "https://fulfillment-staging.paytm.com/dev1", // This is for base
        "https://fulfillment-staging.paytm.com",
        "https://fulfillment.paytm.com"
    ]
};

var allowedEndpoints = config.allowedEndpoints;
Object.keys(allowedEndpoints).forEach(method => {
    allowedEndpoints[method] = Object.keys(allowedEndpoints[method]).filter(regex => allowedEndpoints[method][regex]);
});

module.exports = config;