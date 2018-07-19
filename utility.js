"use strict";
const Request = require("request");
const Tests = require("./tests");

class Utility {

    static workFlowError(type, error) {
        error.type = type;
        return error;
    }

    static request(options) {
        return new Promise((resolve, reject) => {
            Request(options, (err, res) => {
                if(err){
                    return reject(err);
                }

                return resolve(res);
            });
        });
    }

    static compareRequests(optionsArr) {
        let promiseArr = optionsArr.map(options => Utility.request(options));

        return Promise.all(promiseArr)
            .then(response => {
                let baseItemResponse = response[0];
                let testItemResponses = response.splice(1);

                let result = {
                    input: optionsArr[0],
                    expectedOutput: {
                        statusCode: baseItemResponse.statusCode,
                        body: baseItemResponse.body
                    },
                    comparison: {}
                };

                testItemResponses.forEach((testItemResponse, index) => {
                    let host = optionsArr[index].url;
                    result.comparison[host] = {
                        testStatus: true,
                        output: {
                            statusCode: testItemResponse.statusCode,
                            body: testItemResponse.body
                        },
                        tests: {}
                    };

                    for(let testName in Tests) {
                        if(Tests.hasOwnProperty(testName)){
                            let {label, handler} = Tests[testName];
                            let testStatus = handler(baseItemResponse, testItemResponse);
                            
                            result.comparison[host]['tests'][label] = testStatus;
                        }
                    }

                    // set overall test status for this host
                    result.comparison[host].testStatus = !Object.keys(result.comparison[host]["tests"]).some(key => {
                        return result.comparison[host]["tests"][key] === false;
                    });
                });

                return result;
            })
            .catch(error => {
                console.log("Error in compareRequests: ", error);
                return Promise.reject(error);
            });
    }

}

module.exports = Utility;