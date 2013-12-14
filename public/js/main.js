
var $ = require('../../bower_components/jquery/jquery.min.js');
require('./third/jquery.mCustomScrollbar.js');
require('../../bower_components/jquery-ui/ui/jquery-ui.js');
require('../../bower_components/canjs/can.jquery.js');
require('../../bower_components/canjs/can.object.js');
require('../../bower_components/canjs/can.control.plugin.js');
require('../../bower_components/jquery-mousewheel/jquery.mousewheel.js');

var menu = require('./source/MenuControl.js');
var map = require('./source/MapControl.js');


$(document).ready(function() {

    $( "#aboutDialog" ).dialog({
          autoOpen: false,
          width: 600,
          modal: true,
          hide: 'drop',
          show: 'drop',
      });

    new menu.MenuControl('#menuContainer');
    new map.MapControl('#main');
    $('#statusImg').tooltip();

    windowResize();
    $(window).resize(windowResize);
});


//TODO There has to be a better way then resizing like this... 
function windowResize() {
    $('#1andOnlyAd').css('right', (($(window).width() - 468 - 337) / 2));

    $("#mapBox").width(($(window).width() - 371) + "px");
    $("#menuBox").height(($(window).height() - 60) + "px");
    $("#mapBox").height(($(window).height() - 49) + "px");
    $("body").height(($(window).height() - 45) + "px");
}

