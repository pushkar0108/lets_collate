"use strict";

// Load the AWS SDK for Node.js
const AwsSdk = require('aws-sdk');

// Set the region and access credentials, use aws config instead
AwsSdk.config.update({
    // accessKeyId: "xxxx",
    // secretAccessKey: "xxxx",
    region: 'ap-south-1'
});

// Create an SQS service object
const awsSQS = new AwsSdk.SQS({apiVersion: '2012-11-05'});
const queueURL = "https://sqs.ap-south-1.amazonaws.com/065239243787/Replay";

class SQS {

    static sendMessage(msg){
        let params = {
            DelaySeconds: 10,
            MessageAttributes: {},
            MessageBody: JSON.stringify(msg),
            QueueUrl: queueURL
        };

        return new Promise((resolve, reject) => {
            awsSQS.sendMessage(params, function(err, data) {
                if (err) {
                    console.error("Error: ", err);
                    return reject(err);
                } else {
                    console.error("Success: ", data.MessageId);
                    return resolve(data.MessageId);
                }
            });
        });
    }

    static receiveMessage(cb) {
        let params = {
            AttributeNames: [
                "SentTimestamp"
            ],
            MaxNumberOfMessages: 2,
            MessageAttributeNames: [
                "All"
            ],
            QueueUrl: queueURL,
            VisibilityTimeout: 30, /*If we don't tell SQS to delete the message, SQS will "re-queue" the message when the "VisibilityTimeout" expires such that it can be handled by another receiver.*/
            WaitTimeSeconds: 20
        };

        return new Promise((resolve, reject) => {
            awsSQS.receiveMessage(params, (err, data) => {
                if (err) {
                    console.log("Receive Error: ", err);
                    return reject(err);
                } else if (data) {
                    return resolve(data);
                }
            });
        });
    }

    static deleteMessage(msg) {
        let params = {
            QueueUrl: queueURL,
            ReceiptHandle: msg.ReceiptHandle
        };

        return new Promise((resolve, reject) => {
            awsSQS.deleteMessage(params, (err, data) => {
                if (err) {
                    console.log("Delete Error: ", err);
                    return reject(err);
                } else {
                    return resolve(data);
                }
            });
        });
    }

    static purge() {
        let params = {
            QueueUrl: queueURL
        };

        return new Promise((resolve, reject) => {
            awsSQS.purgeQueue(params, (err, data) => {
                if (err) {
                    console.error("Purge Queue Error: ", err);
                    return reject(err);
                } else {
                    return resolve(data);
                }
            });
        });
    }

    static updateAttributes() {
        var params = {
            Attributes: {
                "ReceiveMessageWaitTimeSeconds": "10"
            },
            QueueUrl: queueURL
        };

        return new Promise((resolve, reject) => {
            awsSQS.setQueueAttributes(params, (err, data) => {
                if (err) {
                  console.log("Queue Update Error: ", err);
                  return reject(err);
                } else {
                  console.log("Queue Attributes Updated.");
                  return resolve(data);
                }
            });
        });
    }
}

module.exports = SQS;