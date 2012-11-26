(function( window, Popcorn ) {
  
  // A global callback for youtube... that makes me angry
  window.onYouTubePlayerReady = function( containerId )
  {
    window.onYouTubePlayerReady[ containerId ] && window.onYouTubePlayerReady[ containerId ]();
  };

  // existing youtube references can break us.
  // remove it and use the one we can trust.
  /*
  if ( window.YT ) {
    window.quarantineYT = window.YT;
    window.YT = null;
  }

  onYouTubePlayerAPIReady.waiting = [];

  var _loading = false;
  */

  Popcorn.player( "youtube", {
    _canPlayType: function( nodeName, url ) {

      return typeof url === "string" && (/(?:http:\/\/www\.|http:\/\/|www\.|\.|^)(youtu)/).test( url ) && nodeName.toLowerCase() !== "video";
    },
     _setup : function( options )
  {

    var media = this,
      youtubeObject,
      container = document.createElement( "div" ),
      currentTime = 0,
      seekTime = 0,
      seeking = false,
      delay =false,

      // state code for volume changed polling
      volumeChanged = false,
      lastMuted = false,
      lastVolume = 0;

    container.id = media.id + Popcorn.guid();
    youtubeId = Popcorn.guid();

     var guid = '';
    _.each(Popcorn.guid().toString().split(''), function(num){
      guid += 'abcdefghijklmnopqrstuvwxyz'[num]
    })
    media.youtubeId = guid;//Math.floor( Math.random()*1000).toString(16);
  
    media.appendChild( container );
    media.canPlay=0;
    var youtubeInit = function()
    {
      var flashvars,
          params,
          attributes,
          src,
          width,
          height,
          query;
          canPlay = 0;
    
      // expose a callback to this scope, that is called from the global callback youtube calls
      onYouTubePlayerReady[ container.id ] = function()
      {
        media.youtubeObject = document.getElementById( container.id );
        // more youtube callback nonsense
         stateChangeEventHandler[media.youtubeId] = function( state )
         {

          if ( state === 1&&media.canPlay===0)
          {
            media.canPlay=1;
            media.pause();
            media.readyState = 4;
            media.duration = media.youtubeObject.getDuration();
            media.dispatchEvent( "canplaythrough" );
            media.dispatchEvent( "load" );
            media.dispatchEvent( "durationchange" );   
            media.dispatchEvent( "loadeddata" );
          
          }
          else if(state===1)
          {
            media.paused && media.play();
            // youtube fires paused events while seeking
            // this is the only way to get seeking events
          }
          else if ( state === 2 )
          {
            // silly logic forced on me by the youtube API
            // calling youtube.seekTo triggers multiple events
            // with the second events getCurrentTime being the old time
            if ( seeking && seekTime === currentTime && Math.abs(parseFloat(seekTime) - parseFloat(media.youtubeObject.getCurrentTime()))>2 )
            {
              media.youtubeObject.seekTo( currentTime );
              return;
            }
            else if(seeking && seekTime === currentTime && Math.abs(parseFloat(seekTime) - parseFloat(media.youtubeObject.getCurrentTime()))<2 )
            {
   
              seeking=false;
              delay=true;
              currentTime = media.youtubeObject.getCurrentTime();
              media.dispatchEvent( "timeupdate" );
              !media.paused && media.pause();
              return;
            }
            
            if(delay)
            {
              delay=false;
              return;
            }
            else
            {
              currentTime = media.youtubeObject.getCurrentTime();
              media.dispatchEvent( "timeupdate" );
              !media.paused && media.pause();
              if(options.volume>1) media.youtubeObject.setVolume(options.volume);
            }
        
          }
        };

        stateChangeEventHandler[Popcorn.guid()] = function( errorCode )
        {
          if ( [ 2, 100, 101, 150 ].indexOf( errorCode ) !== -1 )
          {
            media.dispatchEvent( "error" );
          }
        };
        var fxnStr = "stateChangeEventHandler."+ media.youtubeId;
        // youtube requires callbacks to be a string to a function path from the global scope
        media.youtubeObject.addEventListener( "onStateChange", fxnStr );

        media.youtubeObject.addEventListener( "onError", "onErrorEventHandler[" + media.youtubeId+']');

        var timeupdate = function()
        {
          if ( !media.paused )
          {
            if( media.youtubeObject.getCurrentTime) currentTime = media.youtubeObject.getCurrentTime();
            media.dispatchEvent( "timeupdate" );
            setTimeout( timeupdate, 10 );
          }
        };

        var volumeupdate = function()
        {
          if(media&&media.youtubeObject&&media.youtubeObject.isMuted())
          {
            if ( lastMuted !== media.youtubeObject.isMuted() )
            {
              lastMuted = media.youtubeObject.isMuted();
              media.dispatchEvent( "volumechange" );
            }

            if ( lastVolume !== media.youtubeObject.getVolume() )
            {
              lastVolume = media.youtubeObject.getVolume();
              media.dispatchEvent( "volumechange" );
            }
            setTimeout( volumeupdate, 250 );
          }
          
        };

        media.play = function()
        {
          media.paused = false;
          media.dispatchEvent( "play" );

          media.dispatchEvent( "playing" );
          timeupdate();
          media.youtubeObject.playVideo();
        };

        media.pause = function()
        {
          if ( !media.paused )
          {
            media.paused = true;
            media.dispatchEvent( "pause" );
            media.youtubeObject.pauseVideo();
          }
        };

        Popcorn.player.defineProperty( media, "currentTime", {
          set : function( val )
          {
            if(val!==0||options.cue_in===0)
            {
              // make sure val is a number
              currentTime = seekTime = +val;
              seeking = true;
              media.dispatchEvent( "seeked" );
              media.dispatchEvent( "timeupdate" );
              media.youtubeObject.seekTo( currentTime );
            }
            else if(val===0&&options.cue_in===0)
            {
              media.dispatchEvent( "timeupdate" );
            }
            return currentTime;
          },
          get: function()
          {
            return currentTime;
          }
        });

        Popcorn.player.defineProperty( media, "muted", {
          set: function( val )
          {
            if ( media.youtubeObject.isMuted() !== val )
            {
              if ( val )
              {
                media.youtubeObject.mute();
              }
              else
              {
                media.youtubeObject.unMute();
              }
              lastMuted = media.youtubeObject.isMuted();
              media.dispatchEvent( "volumechange" );
            }
            return media.youtubeObject.isMuted();
          },

          get: function()
          {
            return media.youtubeObject.isMuted();
          }
        });

        Popcorn.player.defineProperty( media, "volume", {
          set : function( val )
          {
            if( media.youtubeObject.getVolume)
            {
              if ( media.youtubeObject.getVolume() / 100 !== val )
              {
                media.youtubeObject.setVolume( val * 100 );
                lastVolume = media.youtubeObject.getVolume();
                media.dispatchEvent( "volumechange" );
              }
            }
            return media.youtubeObject.getVolume() / 100;
          },

          get: function()
          {
            if( media.youtubeObject.getVolume) return media.youtubeObject.getVolume() / 100;
          }
        });
    
        media.youtubeObject.loadVideoById(src,options.cue_in);
        
      };

      options.controls = +options.controls === 0 || +options.controls === 1 ? options.controls : 1;
      options.annotations = +options.annotations === 1 || +options.annotations === 3 ? options.annotations : 1;
      options.cue_in=options.cue_in||0;
      options.volume=options.volume||1;
     
      flashvars = { playerapiid: container.id };

      params = {
        wmode: "opaque",
        disablekb: "1" ,
        allowScriptAccess: "always"
      };

      attributes = {
        id: container.id
      };

      src = /^.*(?:\/|v=)(.{11})/.exec( media.src )[ 1 ];
      query = ( media.src.split( "?" )[ 1 ] || "" ).replace( /v=.{11}/, "" );

      // setting youtube player's height and width, default to 560 x 315
      width = media.style.width ? ""+media.offsetWidth : "560";
      height = media.style.height ? ""+media.offsetHeight : "315";
      swfobject.embedSWF("http://www.youtube.com/apiplayer?enablejsapi=1&version=3&key=AI39si7oX_eCGjrxs2lil28MMQdXn-ZWhzku8fGsRVhju-pziYgmI3EOt0o4GmEl00vGXsA_OGGEKwX-xAM0a5Gbsr8zgrGpyg&playerapiid="+container.id,
      container.id, '100%', '100%', "8", null, flashvars, params, attributes);
    };

    if ( !window.swfobject ) Popcorn.getScript( "//ajax.googleapis.com/ajax/libs/swfobject/2.2/swfobject.js", youtubeInit );
    else youtubeInit();
  },
    _teardown: function( options ) {

      options.destroyed = true;

      var youtubeObject = options.youtubeObject;
      if( youtubeObject ){
        youtubeObject.stopVideo();
        youtubeObject.clearVideo && youtubeObject.clearVideo();
      }

      this.removeChild( document.getElementById( options._container.id ) );
    }
  });
}( window, Popcorn ));
