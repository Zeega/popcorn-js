(function(window,Popcorn){

window.onPlayerLoaded = function( containerId ) {
  onPlayerLoaded[ containerId ] && onPlayerLoaded[ containerId ]();
};

window.onLoading= function( containerId, value ) {
  onLoading[ containerId ] && onLoading[ containerId ](value);
};

window.onStateChange= function( containerId, eventid, eventvalue ) {
  onStateChange[ containerId ] && onStateChange[ containerId ](eventid, eventvalue);
};

window.onError= function( containerId, value ) {
  onError[ containerId ] && onError[ containerId ](value);
};



Popcorn.player( "flashvideo", {
  _setup: function( options ) {

    var media = this,
        flashvideoObject,
        container = document.createElement( "div" ),
        currentTime = 0,
        seekTime = 0,
        seeking = false,

        // state code for volume changed polling
        volumeChanged = false,
        lastMuted = false,
        lastVolume = 100;

    container.id = media.id + Popcorn.guid();
  media.waiting =true;
    media.appendChild( container );

    var flashvideoInit = function() {

      var flashvars,
          params,
          attributes,
          src,
          width,
          height,
          query;

      // expose a callback to this scope, that is called from the global callback youtube calls
      onPlayerLoaded[ container.id ] = function() {

        console.log('player '+ container.id + ' has loaded');
    flashvideoObject = document.getElementById (container.id);
    
    onLoading[container.id] = function (value){
      
      if(value==2) media.duration = flashvideoObject.sendToFlash('getEndTime','');
      else if(value==3&&media.waiting){
        media.waiting=false;
        
        
        var timeupdate = function() {
        
            if ( !media.paused ) {
              currentTime = flashvideoObject.sendToFlash('getCurrentTime','');
              media.dispatchEvent( "timeupdate" );
              setTimeout( timeupdate, 10 );
            }
        };
        timeupdate();
        media.play = function() {
          media.paused = false;
          media.dispatchEvent( "play" );
          
          media.dispatchEvent( "playing" );
          timeupdate();
          flashvideoObject.sendToFlash('play','');
        };
        
        media.pause = function() {
          if ( !media.paused ) {
            media.paused = true;
            media.dispatchEvent( "pause" );
            flashvideoObject.sendToFlash('pause','');
          }
        };
        
        Popcorn.player.defineProperty( media, "currentTime", {
          set: function( val ) {
            
            //console.log('setting current time to',val);
            
            // make sure val is a number
            currentTime = seekTime = +val;
            seeking = true;
            media.dispatchEvent( "seeked" );
            media.dispatchEvent( "timeupdate" );
            flashvideoObject.sendToFlash('seek',currentTime);
            return currentTime;
            
          },
          get: function() {
            return currentTime;
          }
            });

        

      Popcorn.player.defineProperty( media, "volume", {
        set: function( val ) {
    
        
        if(val !=flashvideoObject.getVolume())flashvideoObject.sendToFlash('setVolume',val);
        return flashvideoObject.getVolume();
        
        },
        get: function() {
  
        return flashvideoObject.getVolume();
        }
      });
  
    
      media.readyState = 4;
      media.dispatchEvent( "canplaythrough" );
      media.dispatchEvent( "load" );
      media.duration = flashvideoObject.sendToFlash('getEndTime','');
      media.dispatchEvent( "durationchange" );
       
  
      media.dispatchEvent( "loadeddata" );
        }
        
    };
    
    
    onStateChange[container.id] = function (playerId, value){
        
        switch(value){
          case 1: // player loaded
            //console.log("onLoading - player loaded "+playerId);
              break;
          case 2: // metadata loaded
             // console.log("onLoading - metadata loaded "+playerId);
              break;
            case 3: // metadata loaded
             // console.log("onLoading - can play "+playerId);
              break;
            default:
              //console.log("onLoading - " + value);
        }
    };

    onError[container.id] = function (playerId, value){
        
        switch(value){
          case 1: // player loaded
            console.log("onError - failed to load file");
              break;
          case 2: // metadata loaded
                console.log("onError - wrong url or invalid file");
              break;
        }
    };
    var fun = "onLoading." + container.id;
    
    //Do we need these for any reason?
    //flashvideoObject.addEventListener( "onLoading", "onLoading." + container.id );
    //flashvideoObject.addEventListener( "onStateChange", "onStateChange." + container.id );
    //flashvideoObject.addEventListener( "onError", "onError." + container.id );
    
    console.log('player '+ container.id + ' has loaded');
    flashvideoObject.sendToFlash("load", src+','+options.cue_in);
  
    
        
      
      };

      flashvars = {
        vidId: container.id
      };

      params = {
        wmode: "transparent",
        allowScriptAccess: "always",
        allownetworking : "all",
        bgcolor : "#000000"
      };

      attributes = {
        id: container.id
      };

      src = /(http.*)/.exec( media.src )[ 1 ];
     
      swfobject.embedSWF("assets/vendor/popcorn/MediaPlayer.swf", container.id, "100%", "100%", "9.0.0", false, flashvars, params, attributes);
    
    
     
    };

    if ( !window.swfobject ) {

      Popcorn.getScript( "//ajax.googleapis.com/ajax/libs/swfobject/2.2/swfobject.js", flashvideoInit );
    } else {

      flashvideoInit();
    }
  }
});


}(window,Popcorn));