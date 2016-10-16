var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendfile('index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

var SerialPort = require("serialport");

var port = new SerialPort("COM9", {
  baudRate: 115200,
   parser: SerialPort.parsers.readline('\n')
  //parser: SerialPort.parsers.byteDelimiter([3,7,9,13,33,53])
});


var listofmac = [];

function addmac(val,sig) {
	var found = false;
	for(var i=0;i<listofmac.length;i++) {
		if (listofmac[i].mac==val) {
			listofmac[i].sig = sig;
			listofmac[i].ttl = new Date();
			listofmac[i].dead = false;
			found = true;
		}
	}
	if (!found) {
		console.log('adding',val);
		listofmac.push({mac:val,sig:sig, ttl:new Date()});
	}
	var n = new Date();
	for(var i=0;i<listofmac.length;i++) {
		if ((n-listofmac[i].ttl) > 25000 )
		{
			if (!listofmac[i].dead) {
				console.log('remove stale mac');
				listofmac[i].dead = true;
			}
		}
	}
	io.emit('macs',listofmac);
	
}

port.on('open', function() {
  port.on('data',function(data) {
  	
  	if (data.substring(0,2)=='->') {
  		//console.log(data);

  		var sp = data.split('\t');
  		//console.log(sp);
  		var sig = sp[0].substring(3);
  		if (sp[2] && sp[2].length=='AE:09:E3:28:26:43'.length)
  			addmac(sp[2],sig);
  		//addmac(sp[2]);
  	}
  	//console.log(data.subtr(33,50));
  	//data.toString('utf8',33,50)
  });
});