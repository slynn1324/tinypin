/**
 * Returns a handler which will open a new window when activated.
 */
function getClickHandler() {
    return function(info, tab) {

        if ( !info.srcUrl.startsWith('http') ){
          window.alert("Image source is not a URL.");
          return;
        }

        var w = 700;
        var h = 800;
        var left = (screen.width/2)-(w/2);
        var top = (screen.height/2)-(h/2); 

        let s = "";
        if ( info.linkUrl ){
          s = info.linkUrl;

          // strip the google images redirect 
          if ( s.startsWith("https://www.google.com/url?") ){
              let parts = s.split("?");
              
              if ( parts.length == 2 ){
                
                let params = parts[1].split("&");
                
                for( let i = 0; i < params.length; ++i ){
                    let kv = params[i].split("=");

                    if ( kv.length == 2 ){
                      if ( kv[0] == "url" ){
                        s = decodeURIComponent(kv[1]);
                      }
                    }
                }
              }
          }

          s = encodeURIComponent(s);

        } else {
          s = encodeURIComponent(info.pageUrl);
        }



        var q = "i=" + encodeURIComponent(info.srcUrl) + "&s=" + s;


        browser.storage.sync.get({
            server: 'http://localhost:3000'
        }, function(items){
            let server = items.server;

            if ( !server.endsWith('/') ){
              server += '/';
            }

            var url = server + 'addpin.html#' + q;
        
            // Create a new window to the info page.
            // browser.windows.create({ url: url, width: 520, height: 660 });
            browser.windows.create({ url: url, width: w, height: h, left: left, top: top, type: 'popup' });
        });

        
    };
  };
  
  /**
   * Create a context menu which will only show up for images.
   */
  browser.contextMenus.create({
    "title" : "add to tinypin",
    "type" : "normal",
    "contexts" : ["image"],
    "onclick" : getClickHandler()
  });