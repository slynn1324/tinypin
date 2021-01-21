/**
 * Returns a handler which will open a new window when activated.
 */
function getClickHandler() {
    return function(info, tab) {

        var q = "i=" + encodeURIComponent(info.srcUrl) + "&s=" + encodeURIComponent(tab.url);

        // The srcUrl property is only available for image elements.
        var url = 'http://localhost:3000/popup.html#' + q;
    
        // Create a new window to the info page.
        // chrome.windows.create({ url: url, width: 520, height: 660 });
        chrome.windows.create({ url: url, width: 500, height: 500, type: 'popup' });
    };
  };
  
  /**
   * Create a context menu which will only show up for images.
   */
  chrome.contextMenus.create({
    "title" : "Get image info",
    "type" : "normal",
    "contexts" : ["image"],
    "onclick" : getClickHandler()
  });