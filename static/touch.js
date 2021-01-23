// document.addEventListener('touchstart', (e) => {
//     console.log("touchstart");
//     const touch = e.touches[0] || e.changedTouches[0];
//     window.lastY = touch.pageY;
// });

// document.addEventListener('touchmove', (e) => {
//     console.log("touchmove");
//     // Check user isn't scrolling past content. If so, cancel move to prevent ios bouncing
//     const touch = e.touches[0] || e.changedTouches[0];
//     y = touch.pageY;
//     if (y < window.lastY && e.srcElement.scrollTop == (e.srcElement.scrollHeight - e.srcElement.clientHeight)) {
//         console.log("user is trying to scroll down without anywhere to scroll to. Canceling propagation.");
//         e.preventDefault();
//     } else if (y > window.lastY && e.srcElement.scrollTop == 0) {
//         console.log("user is trying to scroll up without anywhere to scroll to. Canceling propagation.");
//         e.preventDefault();
//     }
// });


// window.scrollY = 1;
// document.addEventListener("scroll", (evt) => {
//     console.log(evt);
//     console.log(window.scrollY + "," + window.scrollX);
//     console.log("body=" + document.body.scrollTop);
//     console.log(document.getElementById("app").scrollTop);
//     if (window.scrollY = 0 ){
//         console.log("bump");
//         window.scrollY = 1;
//     }
// });

// document.addEventListener("scroll", (evt) => {
//     console.log(window.scrollY);
//     // if ( window.scrollY < 1 ){
//     //     window.scrollY = 1;
//     // }
// });





// PullToRefresh.init({
//     onRefresh() {
//         window.location.reload();
//     }
// });


// let startX = 0;
// let startY = 0;

// let topPos = 0;

// let lastX = 0;
// let lastY = 0;


// let pullCapped = false;

// let setTop = (i) => {
//     topPos = parseInt(i);
//     if ( topPos > 200 ){
//         topPos = 200;
//         pullCapped = true;
//         div.style.backgroundColor = "green";
//     } else {
//         pullCapped = false;
//         div.style.backgroundColor = "blue";
//     }
//     div.style.top = `${topPos-120}px`;
//     console.log("set top=" + topPos);
// };

// document.addEventListener('touchstart', (evt)=>{
//     console.log("touch start", evt);
//     startX = evt.touches[0].clientX;
//     startY = evt.touches[0].clientY;
// });

// document.addEventListener('touchend', (evt) =>{
//     console.log("end");
//     startX = 0;
//     startY = 0; 
//     div.style.transitionDuration = "0.2s";
//     div.style.top = "-80px";

//     topPos = 0;
    
    
//     setTimeout(() => {
//         div.style.transitionDuration = "0";
//     }, 200);

    

    
    

//     if ( pullCapped ){
//         window.location.reload();
//     }
// });

// document.addEventListener('touchcancel', (evt) =>{
//     console.log("cancel");
//     startX = 0;
//     startY = 0;

//     div.style.top = "-80px";

//     if ( pullCapped ){
//         window.location.reload();
//     }
// });

// document.addEventListener('touchmove', (evt) => {

//     let x = evt.touches[0].clientX;
//     let y = evt.touches[0].clientY;

//     let diff = (y - startY); // / window.devicePixelRatio;

//     if ( window.scrollY == 0 || topPos > 0 ){
//         setTop(diff);
//     }

//     // if ( diff > 0 ){
//     //     addTop(diff)
//     // }

//     console.log(diff);

//     // lastY = y;

//     // let diffY = y - startY;

//     // if ( y > lastY ){

//     //     if ( window.scrollY == 0 ){

//     //         let showPixels = diffY / window.devicePixelRatio;

//     //         let pullHeight = showPixels - (80+25);
//     //         if ( pullHeight > 0 ){
//     //             console.log("cap pull height");
//     //             pullHeight = 0;
//     //             pullCapped = true;
//     //         }

//     //         setTop(pullHeight);
//     //     }

//     //     lastY = y;
    
//     // } else {

//     //     let lastDiff = lastY-y;
//     //     console.log(lastDiff);
        
//     // }

    
// });

// let div = document.createElement("div");
// div.style.position = "fixed";
// div.style.height = "80px";
// div.style.width = "100%";
// div.style.top = "-80px";
// div.style.zIndex = "99999";
// div.style.backgroundColor = "blue";
// // div.style.transitionProperty = 'top';
// // div.style.transitionDuration = "0.2s";

// let content = document.createElement("div");
// content.style="text-align: center";
// content.style.marginTop= "20px";


// let img = document.createElement("img");
// img.src = "data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9JzMwMHB4JyB3aWR0aD0nMzAwcHgnICBmaWxsPSIjMDAwMDAwIiB4bWxuczp4PSJodHRwOi8vbnMuYWRvYmUuY29tL0V4dGVuc2liaWxpdHkvMS4wLyIgeG1sbnM6aT0iaHR0cDovL25zLmFkb2JlLmNvbS9BZG9iZUlsbHVzdHJhdG9yLzEwLjAvIiB4bWxuczpncmFwaD0iaHR0cDovL25zLmFkb2JlLmNvbS9HcmFwaHMvMS4wLyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDY0IDY0IiBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCA2NCA2NCIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PG1ldGFkYXRhPjxzZncgeG1sbnM9Imh0dHA6Ly9ucy5hZG9iZS5jb20vU2F2ZUZvcldlYi8xLjAvIj48c2xpY2VzPjwvc2xpY2VzPjxzbGljZVNvdXJjZUJvdW5kcyBoZWlnaHQ9IjE2Mzg0IiB3aWR0aD0iMTYzODkiIHg9Ii04MTY1IiB5PSItODE2MCIgYm90dG9tTGVmdE9yaWdpbj0idHJ1ZSI+PC9zbGljZVNvdXJjZUJvdW5kcz48L3Nmdz48L21ldGFkYXRhPjxnPjxwYXRoIGQ9Ik0zMiw2QzE3LjY2NCw2LDYsMTcuNjY0LDYsMzJjMCwxNC4zMzcsMTEuNjY0LDI2LDI2LDI2YzE0LjMzNywwLDI2LTExLjY2MywyNi0yNkM1OCwxNy42NjQsNDYuMzM3LDYsMzIsNnogTTMyLDQ4ICAgYy03LjcyLDAtMTQtNi4yOC0xNC0xNGMwLTcuNDU0LDUuODU5LTEzLjU0OCwxMy4yMTItMTMuOTZsLTAuNjI2LTAuNjI2Yy0wLjc4MS0wLjc4MS0wLjc4MS0yLjA0NywwLTIuODI4ICAgYzAuNzgtMC43ODEsMi4wNDctMC43ODEsMi44MjgsMGw0LDRjMC43ODEsMC43ODEsMC43ODEsMi4wNDcsMCwyLjgyOGwtNCw0QzMzLjAyMywyNy44MDUsMzIuNTEyLDI4LDMyLDI4ICAgcy0xLjAyNC0wLjE5NS0xLjQxNC0wLjU4NmMtMC43ODEtMC43ODEtMC43ODEtMi4wNDcsMC0yLjgyOGwwLjU0Mi0wLjU0MkMyNi4wMjEsMjQuNDg4LDIyLDI4Ljc4LDIyLDM0YzAsNS41MTQsNC40ODYsMTAsMTAsMTAgICBjNS41MTQsMCwxMC00LjQ4NiwxMC0xMGMwLTEuMTA0LDAuODk2LTIsMi0yczIsMC44OTYsMiwyQzQ2LDQxLjcyLDM5LjcyLDQ4LDMyLDQ4eiI+PC9wYXRoPjwvZz48L3N2Zz4=";
// img.style.width="48px";
// img.style.height="48px"

// content.appendChild(img);
// div.appendChild(content);
// document.body.appendChild(div);

// console.log("pixel ratio = " + window.devicePixelRatio);