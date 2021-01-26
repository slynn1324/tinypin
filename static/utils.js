function getOriginalImagePath(pinId){
    if ( !pinId ){
        return "";
    }
    let paddedId = pinId.toString().padStart(12, '0');
    let dir = `images/originals/${paddedId[11]}/${paddedId[10]}/${paddedId[9]}/${paddedId[8]}`;
    let file = `${dir}/${paddedId}.jpg`;
    return file;
}

function getThumbnailImagePath(pinId){
    if ( !pinId ){
        return "";
    }
    let paddedId = pinId.toString().padStart(12, '0');
    let dir = `images/thumbnails/${paddedId[11]}/${paddedId[10]}/${paddedId[9]}/${paddedId[8]}`;
    let file = `${dir}/${paddedId}.jpg`;
    return file;
}

function parseQueryString(qs){
    let obj = {};
    let parts = qs.split("&");
    for ( let i = 0; i < parts.length; ++i ){
        let kv = parts[i].split("=");
        if ( kv.length == 2 ){
            let key = decodeURIComponent(kv[0]);
            let value = decodeURIComponent(kv[1]);
            obj[key] = value;
        }
    }
    return obj;
}

let photoSwipeGallery = null;
let isPhotoSwipeOpen = false;

function closePhotoSwipe(){
    photoSwipeGallery.close();
    setTimeout( () => {
        isPhotoSwipeOpen = false;
    }, 10);
}

function openPhotoSwipe(pinId){
    isPhotoSwipeOpen = true;
    
    let data = store.data;

    let pswpElement = document.getElementById("pswp");

    var items = [];
    for ( let i = 0; i < data.board.pins.length; ++i ){
        items.push({
            msrc: getThumbnailImagePath(data.board.pins[i].id),
            src: getThumbnailImagePath(data.board.pins[i].id),
            w: data.board.pins[i].originalWidth,
            h: data.board.pins[i].originalHeight,
            title: data.board.pins[i].description,
            pinId: data.board.pins[i].id,
            siteUrl: data.board.pins[i].siteUrl,
            originalImage: {
                src: getOriginalImagePath(data.board.pins[i].id),
                w: data.board.pins[i].originalWidth,
                h: data.board.pins[i].originalHeight
            },
            mediumImage: {
                src: getThumbnailImagePath(data.board.pins[i].id),
                w: data.board.pins[i].originalWidth,
                h: data.board.pins[i].originalHeight
            }
        });
    }

    let options = {
        showAnimationDuration: 0,
        hideAnimationDuration: 0,
        clickToCloseNonZoomable: false,
        closeOnScroll: false,
        pinchToClose: false,
        shareEl: false,
        shareButtons: [],
        index: getPinIndexById(pinId),
        loop: false,
        bgOpacity: 0.85,
        
        history: false
    };

    // if we want the zoom open animations
    // options.getThumbBoundsFn: isThumbnailClick ? function(index) {
    //     // See Options->getThumbBoundsFn section of docs for more info
    //     var thumbnail = el,
    //         pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
    //         rect = thumbnail.getBoundingClientRect(); 

    //     return {x:rect.left, y:rect.top + pageYScroll, w:rect.width};
    // } : null,

    photoSwipeGallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);

    let realViewportWidth,
        useLargeImages = false,
        firstResize = true,
        imageSrcWillChange;

        photoSwipeGallery.listen('beforeResize', function() {

        var dpiRatio = window.devicePixelRatio ? window.devicePixelRatio : 1;
        dpiRatio = Math.min(dpiRatio, 2.5);
        realViewportWidth = photoSwipeGallery.viewportSize.x * dpiRatio;


        if(realViewportWidth >= 1200 || (!photoSwipeGallery.likelyTouchDevice && realViewportWidth > 800) || screen.width > 1200 ) {
            if(!useLargeImages) {
                useLargeImages = true;
                imageSrcWillChange = true;
            }
            
        } else {
            if(useLargeImages) {
                useLargeImages = false;
                imageSrcWillChange = true;
            }
        }

        if(imageSrcWillChange && !firstResize) {
            photoSwipeGallery.invalidateCurrItems();
        }

        if(firstResize) {
            firstResize = false;
        }

        imageSrcWillChange = false;

    });

    photoSwipeGallery.listen('gettingData', function(index, item) {
        if( useLargeImages ) {
            item.src = item.originalImage.src;
            item.w = item.originalImage.w;
            item.h = item.originalImage.h;
        } else {
            item.src = item.mediumImage.src;
            item.w = item.mediumImage.w;
            item.h = item.mediumImage.h;
        }
    });


    photoSwipeGallery.init();
}
