"use strict";

const Tests = {
    "responseStatus": {
        label: "Response Status",
        handler: function(baseItem, testItem){
            return baseItem.statusCode === testItem.statusCode;
        }
    },
    "responseBody": {
        label: "Response Body",
        handler: function(baseItem, testItem){
            return JSON.stringify(baseItem.body) === JSON.stringify(testItem.body);
        }
    }
};

module.exports = Tests;