/*
  this piece of code read and store file names with an input directory (folderdir, the argument 
  for initialize method) and analyses the closest airport for a given location (centralLat, centralLon, both 
  are the arguments for closestAirport method).
  The result will be a Json object contains all the information about the closest airport to the input location.
*/

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var async = require('async');
var geocoderProvider = 'google';
var geocoder = require('node-geocoder').getGeocoder(geocoderProvider, 'http');
var fs = require('fs');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect('mongodb://tester:jayTester1@128.8.215.67:27017/test');

var db = mongoose.connection;
var Airportfile;

// centralLat and centralLon are two inputs to closestAiport() function
var centralLat = 35.895733;
var centralLon = -114.985748; 

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(callback){
  console.log("mongodb connected!");

  var airportfileSchema = new Schema({
    name: String,
    lat: Number,
    lon: Number,
    filedir: String
  });

  Airportfile = mongoose.model('Airportfile', airportfileSchema);
  //var a = new Airportfile({name: "dulles", lat: 333, lon: 444, filedir: "home directory"});
  closestAirport(centralLat, centralLon);
  //initialize("./airports");

});

// find all the lat lon for the airport listed in the folder (argument) and store them in test db 

function initialize(folderdir) {
  // read and parse the file names
  var files = fs.readdirSync(folderdir);
  var airports = [];
  var unsuccess = [];

  var index = 0;
  async.whilst (
    function(){return index < files.length; },

    function(callback){
    /* use split of "_" to split the file name into an array and then parse the airport name
     with the replace function to get rid of the numbers*/

      var name = files[index ++];
      var arr = name.split("_");

      if (arr[2] != undefined) {
      var ap = arr[2].replace(/[0-9]/g,"");
      var la, lo;
      geocoder.geocode(ap, function(err, res){
        if (err) {
          console.log(err);
          unsuccess.push(ap);
          var a = new Airportfile({name: ap, lat: null, lon: null, filedir: folderdir + "/" + name});
          a.save(function(err){
            if (err)
              console.log(err);
          });

        } else {
          la = res[0].latitude;
          lo = res[0].longitude;

          var air = {name: ap, lat: la, lon: lo, filedir: folderdir + name}
          var a = new Airportfile({name: ap, lat: la, lon: lo, filedir: folderdir + "/" + name});
          a.save(function(err){
            if (err)
              console.log(err);
            //else
              //console.log("data saved!");
          });
          //console.log(air);
          airports.push(air);
      }
      });
    }

      setTimeout(callback, 200);

    },
  
    function(err){
      if (err) console.log(err);

      console.log("done");
      console.log(airports);
      console.log(unsuccess);
    }
  );
}

//initialize("./airports");


// distance portion from Nick
function LatLon(lat, lng) {
  this.latitude = lat;
  this.longitude = lng;
}
/**
 * Returns the distance from 'this' point to destination point (using haversine formula).
 *
 * @param   {LatLon} point - Latitude/longitude of destination point.
 * @returns {number} Distance between this point and destination point, in km (on sphere of 'this' radius).
 *
 * @example
 *     var p1 = new LatLon(52.205, 0.119), p2 = new LatLon(48.857, 2.351);
 *     var d = p1.distanceTo(p2); // d.toPrecision(4): 404.3
 */
Number.prototype.toRadians = function() {
    return this * Math.PI / 180;
};
Number.prototype.toDegrees = function() {
    return this * 180 / Math.PI;
};

LatLon.prototype.distanceTo = function (point) {
    var R = 6371;
    var phi1 = this.latitude.toRadians(),
        lambda1 = this.longitude.toRadians();
    var phi2 = point.latitude.toRadians(),
        lambda2 = point.longitude.toRadians();
    var deltaPhi = phi2 - phi1;
    var deltaLambda = lambda2 - lambda1;

    var a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c * 1000;
    return d;
};

function closestAirport (centralLat, centralLon) {
  // retrieve data
  var apInfo = [];
  Airportfile.find({}, function(err, docs){
    apInfo = docs;

    var apJson;
    var d;

    for (var i = 0; i < apInfo.length; i++) {
      if (apInfo[i].lat == null || apInfo[i].lon == null)
        continue;

      var p1 = new LatLon(centralLat, centralLon);
      var p2 = new LatLon(apInfo[i].lat, apInfo[i].lon);
      var curD = p1.distanceTo(p2);
      
      if (d == null || d > curD) {
        d = curD;
        apJson = apInfo[i];
      }

    }

    console.log(apJson);
    return apJson;
  });

  
}


//var address = 'Helena.Rgnl.AP.723340';
//address = address.replace(/[0-9]/g, '');



app.get('/', function(req, res) {
	res.send("hello world!");
});

io.on('connection', function(socket){
  console.log("got in!");

});

http.listen(3000, function(){
	console.log('listening on *:3000');
});
