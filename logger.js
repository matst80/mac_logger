var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var arp = require('node-arp');
var fs = require('fs');
var util = require('util');

//var log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'w'});
var mac_file = fs.createWriteStream(__dirname + '/mac.log', {flags : 'w'});
var macsign_file = fs.createWriteStream(__dirname + '/macsign.log', {flags : 'w'});
var log_stdout = process.stdout;

var mysql = require('mysql2');

var connection = mysql.createConnection({host:'10.10.10.1', user: 'webdoc', password: 'kaninbur', database:'macdb'});
 

var mqtt = require('mqtt')
var client = mqtt.connect('mqtt://10.10.10.1')

 app.get('/', function(req, res) {
   var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
   var name = req.param('name');
   ip  = ip.substring(ip.lastIndexOf(':')+1);
   
   console.log('ip',ip);
   arp.getMAC(ip, function(err, mac) {
    console.log(arguments);
    if (!err) {
        
        macsign_file.write(ip+':'+mac+','+new Date().toString()+'\n\r');

        if (name && name.length>0) {
                connection.execute('UPDATE `maclist` SET Name=? WHERE `Mac` = ?', [name,mac], function (err, results) {
                    console.log(err,results);
            });
           }
    }
    else 
        console.log(err);
   });
   res.sendfile('index2.html');
 });

 io.on('connection', function(socket){
   //console.log('a user connected');
 });

 http.listen(3000, function(){
  console.log('listening on *:3000');
 });

//client.publish('/smarthome/clientmac/' + (listofmac[i].mac), 'OFF');


client.on('connect', function () {
  client.subscribe('/smarthome/clientmac/+')
  //client.publish('presence', 'Hello mqtt')
});

client.on('message', function (topic, message) {
  // message is Buffer 
  console.log(topic,message.toString(), new Date().toString());



  //client.end();
  mac_file.write(topic+','+message+','+new Date().toString()+'\n\r');
})