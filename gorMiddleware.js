#!/usr/bin/env node
"use strict";

const readline = require("readline");
const StringDecoder = require("string_decoder").StringDecoder;
const decoder = new StringDecoder("utf8");

const SQS = require('./awsSQS');
const CONFIG = require('./config');


const convertHexString = (hex) => {
  var bytes = [];
  for (var i = 0; i < hex.length - 1; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return decoder.write(Buffer.from(bytes));
};

const handleRequest = (request) => {
    let components = request.split("\n");
    let [type, reqId] = components[0].split(" ");
    let [method, endpoint] = components[1].split(' ');

    // Check request type
    if(parseInt(type) !== 1){
        return;
    }

    // Check if endpoint is enabled for analysis
    let absoluteEndPoint = endpoint.split("?")[0];
    let allowedEndpoints = CONFIG.allowedEndpoints[method];
    let isMatchingRequest = allowedEndpoints.some(allowedEndpoint => {
        return RegExp(allowedEndpoint).test(absoluteEndPoint);
    });

    if(!isMatchingRequest){
        console.error("Not a matching request: ", endpoint);
        return;
    }

    // Scrap headers from the request
    let headers = {};
    components.forEach(element => {
        try {
            let headerName = element.split(': ')[0];
            if(CONFIG.allowedHeaders[headerName]){
                let val = element.split(': ')[1];

                // Remove trailing \r from the value
                if(val[val.length - 1] == "\r"){
                    val = val.substring(0, val.length - 1);
                }

                headers[headerName] = val;
            }
        } catch (error) {
            console.error("Error in parsing the headers: ", error);
            return;
        }
    });

    // Scrap body from the request
    let body = components.splice(components.indexOf("\r"), components.length+1).join("");
    
    // handle edge condition where no body is sent in post call
    if(body === "\r"){
        body = undefined;
    }

    try {
        body = body && JSON.parse(body);
    } catch (error) {
        console.error("Error in parsing the body: ", error);
        return;
    }

    console.error("reqId: ", reqId);
    console.error("method: ", method);
    console.error("endpoint: ", endpoint);
    console.error("headers: ", headers);
    console.error("body: ", body);

    SQS.sendMessage({
        "reqId": reqId,
        "method": method,
        "endpoint": endpoint,
        "headers": headers,
        "body": body
    });
};

const fetchConfig = () => {
    return new Promise((resolve, reject) => {
        setTimeout(function(){
            return resolve({});
        }, 3000);
    });
};

const rl = readline.createInterface({
    input: process.stdin
});


console.error("Init GOR middleware");
SQS.purge()
    .then(response => {
        console.error("SQS purged successfully");
        return fetchConfig();
    })
    .then(config => {
        console.error("CONFIG successfully fetched: ", config);
        console.error("GOR listner started");
        rl.on("line", (input) => {
            const str = convertHexString(input);
            handleRequest(str);
        });
    })
    .catch(error => {
        console.error("Error in setting up GOR listiner: ", error);
    });