//var app = require('express')();
//var http = require('http').Server(app);
//var io = require('socket.io')(http);

var mqtt = require('mqtt')
var client = mqtt.connect('mqtt://10.10.10.1')

// app.get('/', function(req, res){
//   res.sendfile('index.html');
// });

// io.on('connection', function(socket){
//   console.log('a user connected');
// });

// http.listen(3000, function(){
//   console.log('listening on *:3000');
// });

var SerialPort = require("serialport");

var port = new SerialPort("COM4", {
    baudRate: 115200,
    parser: SerialPort.parsers.readline('\n')
        //parser: SerialPort.parsers.byteDelimiter([3,7,9,13,33,53])
});

var triangNr = 0;

var listofmac = [];

function addmac(val, sig) {
    var found = false;
    for (var i = 0; i < listofmac.length; i++) {
        if (listofmac[i].mac == val) {
            listofmac[i].sig = sig;
            listofmac[i].ttl = new Date();
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
            var sig = sp[0].substring(3);
            if (sp[2] && sp[2].length == 'AE:09:E3:28:26:43'.length)
                addmac(sp[2].toLowerCase().replace(/\:/igm, ''), sig);
            //addmac(sp[2]);%
        }
        //console.log(data.subtr(33,50));
        //data.toString('utf8',33,50)
    });
});