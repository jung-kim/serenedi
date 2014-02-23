var util = require("./Util.js");
var today = new Date();
var weekAfter = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);

var MapModel = function(mapControl) {
  this.prop = new can.Observe({lat: 40.72616, 
                                                lng: -73.99973, 
                                                radius: undefined, 
                                                types: '1111111111111111111',
                                                ready: false,
                                                dateFrom: util.getPrettyDate(today),
                                                dateTo: util.getPrettyDate(weekAfter)});

  this.types = new can.Observe({conf: true,
                                                conv: true,
                                                ent: true,
                                                fair: true,
                                                food: true,
                                                fund: true,
                                                meet: true,
                                                music: true,
                                                perf: true,
                                                rec: true,
                                                relig: true,
                                                reun: true,
                                                sales: true,
                                                semi: true,
                                                soci: true,
                                                sports: true,
                                                trade: true,
                                                travel: true,
                                                other: true});

  this.map = null;
  this.ids = [];
  this.markers = [];
  this.lastClick = {marker: null, info: null};
  this.latestLoc = {lat: null, lng: null};
  this.eventToOpenID = null;
  this.dragging = false;
  this.waitedSinceLastChange = undefined;
  this.distCheckPass = true;
  this.mapControl = mapControl;

  var self = this;

  this.prop.bind('change', function(event, attr, how, newVal, oldVal) {
    if (this.ready) {
      console.log(90909);
      clearTimeout(this.waitedSinceLastChange);
      this.waitedSinceLastChange = setTimeout(self.updateMap.apply(self), 1400);
    }
  });

  this.prop.bind('lat', function(event, newVal, oldVal) {
    this.distCheckPass = false;
  });

  this.prop.bind('lng', function(event, newVal, oldVal) {
    this.distCheckPass = false;
  });

  this.prop.bind('radius', function(event, newVal, oldVal) {
    this.distCheckPass = true;
  });

  this.prop.bind('types', function(event, newVal, oldVal) {
    self.clearMap();
    this.distCheckPass = true;
  });

  this.types.bind('change', function(event, attr, how, newVal, oldVal) {
    self.prop.attr('types', (this.conf ? '1' : '0') + 
                                      (this.conv ? '1' : '0') +
                                      (this.ent ? '1' : '0') + 
                                      (this.fair ? '1' : '0') + 
                                      (this.food ? '1' : '0') + 
                                      (this.fund ? '1' : '0') + 
                                      (this.meet ? '1' : '0') + 
                                      (this.music? '1' : '0') + 
                                      (this.perf ? '1' : '0') + 
                                      (this.rec ? '1' : '0') + 
                                      (this.relig ? '1' : '0') + 
                                      (this.reun ? '1' : '0') + 
                                      (this.sales ? '1' : '0') + 
                                      (this.semi ? '1' : '0') + 
                                      (this.soci ? '1' : '0') + 
                                      (this.sports ? '1' : '0') + 
                                      (this.trade ? '1' : '0') + 
                                      (this.travel ? '1' : '0') + 
                                      (this.other ? '1' : '0'));
  });
};
exports.MapModel = MapModel;

MapModel.prototype.centerToLatLng = function() {
  this.map.setCenter(new google.maps.LatLng(this.prop.lat, this.prop.lng));
};

MapModel.prototype.clearMap = function () {
  this.closeLastOpen();

  for (var n = 0; n < this.markers.length; n++) {
    this.markers[n].setMap(null);
  }

  this.markers = [];
  this.ids = [];
};

MapModel.prototype.getScreenTravelDistance = function() {
  return util.getDistanceFromLatLng(this.prop.lat, this.prop.lng, this.latestLoc.lat, this.latestLoc.lng);
};

MapModel.prototype.closeLastOpen = function () {
  if (this.lastClick.info) {
    this.lastClick.info.close();
  }
  if (this.lastClick.marker) {
    this.lastClick.marker.setAnimation(null);
  }
  this.lastClick.info = null;
  this.lastClick.marker = null;
};

MapModel.prototype.validateLatLng = function() {
  return util.isNumber(this.prop.lat) && util.isNumber(this.prop.lng);
};

MapModel.prototype.initializeMap = function () {
  var self = this;

  this.map = new google.maps.Map(document.getElementById('mapBox'), {
    zoom : 15,
    center : new google.maps.LatLng(self.prop.lat, self.prop.lng),
    mapTypeId : google.maps.MapTypeId.ROADMAP,
    disableDefaultUI: true,
    mapTypeControl: true
  });

  google.maps.event.addListenerOnce(this.map, 'idle', function() {
    var ne = self.map.getBounds().getNorthEast();
    var sw = self.map.getBounds().getSouthWest();

    self.prop.attr('radius', util.getDistanceFromLatLng(ne.lat(), ne.lng(), sw.lat(), sw.lng()) / 3);
    self.prop.attr('lat', util.roundNumber(self.map.getCenter().lat()));
    self.prop.attr('lng', util.roundNumber(self.map.getCenter().lng()));
  });

  google.maps.event.addListener(this.map, 'dragstart', function() {
    self.dragging = true;
  });

  google.maps.event.addListener(this.map, 'dragend', function() {
    self.dragging = false;
    self.prop.attr('lat', util.roundNumber(self.map.getCenter().lat()));
    self.prop.attr('lng', util.roundNumber(self.map.getCenter().lng()));
  });

  google.maps.event.addListener(this.map, 'zoom_changed', function() {
    var ne = self.map.getBounds().getNorthEast();
    var sw = self.map.getBounds().getSouthWest();

    self.prop.attr('radius', util.getDistanceFromLatLng(ne.lat(), ne.lng(), sw.lat(), sw.lng()) / 3);
  });
};


MapModel.prototype.isNeedUpdate = function() {
  if (this.dragging) {
    console.log(34);
    return false;
  }
  // Is it current working?
  if (this.mapControl.getStatus() === 1) {
    console.log(33);
    return false;
  }
  if (this.prop.radius > 19) {
    console.log(22);
    this.mapControl.setStatus(3);
    return false;
  } 
  if (!this.validateLatLng()) {
    console.log(11);
    return false;
  }

  return this.distCheckPass || Math.abs(this.getScreenTravelDistance()) > this.prop.radius / 1.5;
};

MapModel.prototype.updateMap = function() {
  console.log(this);
  if (this.isNeedUpdate()) {
    console.log(3);
    this.mapControl.setStatus(1);
    this.latestLoc.lat = this.prop.lat;
    this.latestLoc.lng = this.prop.lng;

    if (this.eventToOpenID) {
      this.mapControl.getEventsByIDCall({
        message: { id : this.eventToOpenID,
          radius : this.prop.radius
        }
      });
    } else {
      this.mapControl.getEventsCall({
        message: { 
          lat : this.prop.lat,
          lng : this.prop.lng,
          dateFrom : this.prop.dateFrom,
          dateTo : this.prop.dateTo,
          type : this.prop.types,
          radius : this.prop.radius
        }
      });
    }
  }
};

MapModel.prototype.addEventMarker = function (event) {
  var point = new google.maps.LatLng(event.venue.latitude, event.venue.longitude);

  var marker = new google.maps.Marker({
    position: point,
    map : this.map,
    title : event.title,
    animation : google.maps.Animation.DROP,
    clickable : true
  });

  this.markers.push(marker);

  google.maps.event.addListener(
    marker,
    'click',
    function() {
      this.closeLastOpen();

      var info = new google.maps.InfoWindow({
        content: can.view.render('infoPopUpTemplate',
        {   
          title: marker.getTitle(), 
          url: {eventbrite: event.url, serenedi: SERENEDI_URL + '/?id=' + event.id},
          start: event.start_date.split(' ')[0],
          end: event.end_date.split(' ')[0],
          showAddr: event.venue.address !== null || event.venue.address !== '',
          addr: event.venue.address + ' ' + event.venue.address_2,
          city: event.venue.city,
          region: event.venue.region,
          zip: event.venue.postalcode,
          category: event.category
        })
      });

      google.maps.event.addListenerOnce(info, 'closeclick', function() {
        marker.setAnimation(null);
      });

      google.maps.event.addListenerOnce(info, 'domready', function() {
          FB.XFBML.parse();
      }); 

      info.open(this.map, marker);

      marker.setAnimation(google.maps.Animation.BOUNCE);

      this.lastClick.marker = marker;
      this.lastClick.info = info;

      FB.XFBML.parse();
    });

  if (event.id === this.eventToOpenID) {
    google.maps.event.trigger(marker, 'click');
    this.eventToOpenID = null;
    var center = this.map.getCenter();
    this.prop.attr('lat', util.roundNumber(center.lat()));
    this.prop.attr('lng', util.roundNumber(center.lng()));
  }
};