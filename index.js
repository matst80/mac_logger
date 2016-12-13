//var app = require('express')();
//var http = require('http').Server(app);
//var io = require('socket.io')(http);

var mqtt = require('mqtt');
var client = mqtt.connect('mqtt://10.10.10.1');
var mysql = require('mysql2');

var connection = mysql.createConnection({host:'10.10.10.1', user: 'webdoc', password: 'kaninbur', database:'macdb'});

var SerialPort = require("serialport");

var port = new SerialPort("COM5", {
    baudRate: 115200,
    parser: SerialPort.parsers.readline('\n')
        //parser: SerialPort.parsers.byteDelimiter([3,7,9,13,33,53])
});

var triangNr = 1;

var listofmac = [];

function addmac(val, sig) {
    var found = false;
    for (var i = 0; i < listofmac.length; i++) {
        if (listofmac[i].mac == val) {
            listofmac[i].sig = sig;
            listofmac[i].ttl = new Date();
            if (listofmac[i].dead) {
                client.publish('/smarthome/clientmac/' + val, 'ON');
            }
            listofmac[i].dead = false;
            found = true;
            client.publish('/smarthome/clientmac/' + val + '/signal' + triangNr, sig);
        }
    }
    if (!found) {
        console.log('adding', val);
        var newobj = { mac: val, sig: sig, ttl: new Date() };
        listofmac.push(newobj);
        client.publish('/smarthome/clientmac/' + val, 'ON');
    }
    var n = new Date();
    for (var i = 0; i < listofmac.length; i++) {
        if ((n - listofmac[i].ttl) > 55000) {
            if (!listofmac[i].dead) {
                console.log('remove stale mac');
                listofmac[i].dead = true;
                client.publish('/smarthome/clientmac/' + (listofmac[i].mac), 'OFF');
            }
        }
    }
    //io.emit('macs', listofmac);

}

port.on('open', function() {
    port.on('data', function(data) {

        if (data.substring(0, 2) == '->') {
            //console.log(data);

            var sp = data.split('\t');
            //console.log(sp);
            var sig = sp[0].substring(7);
            if (sp[2] && sp[2].length == 'AE:09:E3:28:26:43'.length)
                addmac(sp[2].toLowerCase().replace(/\:/igm, ''), sig);

            connection.execute('UPDATE `maclist` SET LastSeen=?, Distance'+triangNr+'=? WHERE `Mac` = ?', [new Date(),sig,sp[2]], function (err, results) {
                //console.log(sig);
                if (results.affectedRows==0) {
                    connection.execute('INSERT INTO `maclist` (Mac, LastSeen, Distance'+triangNr+') VALUES(?, ?, ?);', [sp[2],new Date(),sig], function(err,res) {
                        //console.log('add',err,res);
                    });
                }
                
            });
            //addmac(sp[2]);%
        }
        //console.log(data.subtr(33,50));
        //data.toString('utf8',33,50)
    });
});