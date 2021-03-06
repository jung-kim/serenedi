var Q = require('q');
var argv = require('optimist').argv;
var util = require('../shared/Util.js');
var http = require('http');

var getDeferred = function(param) {
  var d = Q.defer();

  http.get(param, function(httpRes) {
    httpRes.setEncoding('utf8');
    var result = '';

    httpRes.on('error', function(error) {
      d.reject(error);
    });

    httpRes.on('data', function(data) {
      result += data.trim();
    });

    httpRes.on('end', function() {
      d.resolve(JSON.parse(result));
    });
  });

  return d;
};

module.exports.searchEvents = function(query) {
  return getDeferred(this.buildEventSearchParam(query)).promise;
};

module.exports.getEvent = function(query, res) {
  return getDeferred(this.buildGetEventParam(query)).promise;
};

module.exports.buildGetEventParam = function(args) {
  return 'http://api.meetup.com/2/event/' +
    args.id +
    '?key=' + argv.meetupKey;
};

module.exports.buildEventSearchParam = function(args) {
  return 'http://api.meetup.com/2/open_events.json' +
    '?lon=' + args.lng +
    '&lat=' + args.lat +
    '&radius=' + util.kmToMile(args.radius) +
    '&time=' +  (new Date(args.dateFrom)).getTime() + ',' + (new Date(args.dateTo)).getTime() +
    '&key=' + argv.meetupKey;
};

module.exports.convertReceivedData = function(data) {
  var events = [];
  data = data.results;

  for (var n = 0; n < data.length; n++) {
    var event = {};
    var current = data[n];

    var startDate = new Date(current.time);

    event.id = current.id.toString();
    event.title = current.name;
    event.lat = current.venue && current.venue.lat ? current.venue.lat : current.group.group_lat;
    event.lng = current.venue && current.venue.lon ? current.venue.lon : current.group.group_lon;
    event.url = current.event_url;
    event.startDate = util.getPrettyDate(startDate);
    event.endDate = null;
    if (current.venue) {
      event.addr = current.venue.address_1 + ' ' + current.venue.address_2;
      event.city = current.venue.city;
      event.region = current.venue.state;
      event.zip = current.venue.zip;
    }
    event.category = current.group ? current.group.category : null;
    event.type = util.meetUpPrefix;

    events.push(event);
  }

  return events;
};
