var express = require('express');
var async = require('async');
var cds = require('sap-cds');
var router = express.Router();
var winston = require('winston');
var util = require('./util');

winston.level = process.env.winston_level || 'error'
// method will pick records from SOShadow.Header and add to SO.Header
// and SOShadow.Item and add to SO.Item
router.get('/replicate/sales', function (req, res) {
    var client = req.db;
    var origTable = "SO.Header";
    util.getTableInfo(client, origTable, origTable, function(error, response) {
        var tableSize = response[0].RECORD_COUNT;
        console.log("table size " + tableSize);
        var query = 'insert into "sap.hana.democontent.epm.data::SO.Header" '
                    + 'SELECT TOP 1000 '
                    + "(\"SALESORDERID\" + " + tableSize + ') AS "SALESORDERID",'
                    + ' "HISTORY.CREATEDBY.EMPLOYEEID",	"HISTORY.CREATEDAT",'
                    + ' "HISTORY.CHANGEDBY.EMPLOYEEID",	"HISTORY.CHANGEDAT",'
                    + ' "NOTEID", "PARTNER.PARTNERID",	"CURRENCY",	"GROSSAMOUNT",'
                    + '	"NETAMOUNT", "TAXAMOUNT", "LIFECYCLESTATUS", "BILLINGSTATUS",'
                    + '	"DELIVERYSTATUS" FROM "sap.hana.democontent.epm.data.shadow::SOShadow.Header"';
        client.exec(query, function(error, response) {
            if (error) {
                util.callback(error, response, res, "");
            } else {
                var salesOrdersAdded = response;
                var query = 'insert into "sap.hana.democontent.epm.data::SO.Item" '
                        + 'SELECT '
                        + "(\"SALESORDERID\" + " + tableSize + ') AS "SALESORDERID",'
                        + ' "SALESORDERITEM", "PRODUCT.PRODUCTID", "NOTEID",'
                        + ' "CURRENCY", "GROSSAMOUNT", "NETAMOUNT", "TAXAMOUNT",'
                        + ' "ITEMATPSTATUS", "OPITEMPOS", "QUANTITY", "QUANTITYUNIT",'
                        + ' "DELIVERYDATE" FROM "sap.hana.democontent.epm.data.shadow::SOShadow.Item"'
                        + ' WHERE "SALESORDERID" < 500001000';
                client.exec(query, function(error, response) {
                    util.callback(error, response, res,
                                "Sales orders replicated successfully, records added: " + salesOrdersAdded);            
                });
            }
        });
    });
});

// method will pick records from POShadow.Header and add to PO.Header
// and POShadow.Item to PO.Item
router.get('/replicate/purchase', function (req, res) {
    var client = req.db;
    var origTable = "PO.Header";
    util.getTableInfo(client, origTable, origTable, function(error, response) {
        var tableSize = response[0].RECORD_COUNT;
        console.log("table size " + tableSize);
        var query = 'insert into "sap.hana.democontent.epm.data::PO.Header" '
                    + 'SELECT '
                    + "(\"PURCHASEORDERID\" + " + tableSize + ') AS "PURCHASEORDERID",'
                    + ' "HISTORY.CREATEDBY.EMPLOYEEID",	"HISTORY.CREATEDAT",'
                    + ' "HISTORY.CHANGEDBY.EMPLOYEEID",	"HISTORY.CHANGEDAT",'
                    + ' "NOTEID", "PARTNER.PARTNERID",	"CURRENCY",	"GROSSAMOUNT",'
                    + '	"NETAMOUNT", "TAXAMOUNT", "LIFECYCLESTATUS", "APPROVALSTATUS",'
                    + ' "CONFIRMSTATUS", "ORDERINGSTATUS",'
                    + '	"INVOICINGSTATUS" FROM "sap.hana.democontent.epm.data.shadow::POShadow.Header"';
        client.exec(query, function(error, response) {
            if (error) {
                util.callback(error, response, res, "");
            } else {
                var purchaseOrdersAdded = response;
                var query = 'insert into "sap.hana.democontent.epm.data::PO.Item" '
                        + 'SELECT '
                        + "(\"PURCHASEORDERID\" + " + tableSize + ') AS "PURCHASEORDERID",'
                        + ' "PURCHASEORDERITEM", "PRODUCT.PRODUCTID", "NOTEID",'
                        + ' "CURRENCY", "GROSSAMOUNT", "NETAMOUNT", "TAXAMOUNT",'
                        + ' "QUANTITY", "QUANTITYUNIT",'
                        + ' "DELIVERYDATE" FROM "sap.hana.democontent.epm.data.shadow::POShadow.Item"';
                client.exec(query, function(error, response) {
                    util.callback(error, response, res,
                                "Purchase orders replicated successfully, records added: " + purchaseOrdersAdded);            
                });
            }
        });
    });
});

module.exports = router;