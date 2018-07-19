"use strict";
const PFFUTILS 	= require("pff-utils");

const SQS       = require('./awsSQS');
const Utility   = require('./utility');
const CONFIG    = require('./config');
const Logger 	= PFFUTILS.logger;

Logger.info = Logger.error;
Logger.verbose = Logger.error;


const processMsg = (Message) => {
    let msg = JSON.parse(Message.Body);
    Logger.info("[pollQueueForMessages] Msg payload received from SQS: ", {
        MessageId: Message.MessageId
    });
    Logger.verbose("[pollQueueForMessages] Msg payload received from SQS:", {
        Message: Message
    });

    let optionsArr = CONFIG.targetEndpoints.map(target => {
        return {
            json: true,
            url: target/* + msg.endpoint*/,
            headers: msg.headers,
            body: msg.body
        };
    });

    return Utility.compareRequests(optionsArr)
        .then(result => {
            Logger.info("[pollQueueForMessages] Comparison Results received: ", {
                MessageId: Message.MessageId
            });
            Logger.verbose("[pollQueueForMessages] Comparison Results: ", {
                MessageId: Message.MessageId,
                result: result
            });
            return SQS.deleteMessage(Message);
        })
        .then(response => {
            Logger.info("[pollQueueForMessages] Msg deleted successfully: ", {
                MessageId: Message.MessageId
            });
            Logger.verbose("[pollQueueForMessages] Msg deleted successfully: ", {
                MessageId: Message.MessageId,
                response: response
            });
        })
        .catch(error => {
            Logger.error("[pollQueueForMessages] Error in prcessing the message: ", {
                MessageId: Message.MessageId,
                error: error
            });
            return Promise.reject(error);
        });
};

const pollQueueForMessages = () => {
    let requestId;

    return SQS.receiveMessage()
        .then(data => {
            requestId = data.ResponseMetadata.RequestId;
            if(!data.Messages){
                throw Utility.workFlowError(
                    "EmptyQueue",
                    new Error( "There are no messages to process for Request Id: " + requestId)
                );
            }

            let count = data.Messages.length;
            Logger.info("[pollQueueForMessages] Messages received from SQS: ", {
                requestId: requestId,
                count: count
            });
            Logger.verbose("[pollQueueForMessages] Data received from SQS: ", {
                requestId: requestId,
                data: data
            });
            return new Promise((resolve, reject) => {
                data.Messages.forEach(Message => {
                    processMsg(Message)
                        .finally(() => {
                            count--;
                            if(count === 0){
                                return resolve(data);
                            }
                        });
                });
            });
        })
        .then(() => {
            Logger.info("[pollQueueForMessages] Iteration COMPLETED: ", {
                requestId: requestId
            });
        })
        .catch(error => {
            switch(error.type) {
                case "EmptyQueue":
                    Logger.error("[pollQueueForMessages] Expected Error", {
                        errorMsg: error.message
                    });
                    break;
                default:
                    Logger.error("[pollQueueForMessages] Unexpected Error", {
                        error: error
                    });
                    break;
            }
        })
        .finally(pollQueueForMessages);
};

pollQueueForMessages();