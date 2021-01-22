app.addComponent('navbar', (store) => { return new Reef("#navbar", {
    store: store,
    template: (data) => {

        let boardName = "";

        if ( data.board ){
            boardName = /*html*/`
            <span class="navbar-item">${data.board.name} &nbsp;
                <a data-onclick="editBoardModal.open" style="padding-top: 3px;"><img alt="edit" width="16" height="16" src="data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9JzMwMHB4JyB3aWR0aD0nMzAwcHgnICBmaWxsPSIjMDAwMDAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGRhdGEtbmFtZT0iTGF5ZXIgMSIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHg9IjBweCIgeT0iMHB4Ij48dGl0bGU+NTE8L3RpdGxlPjxwYXRoIGQ9Ik04NC44NTAxMiw1MFY4MS43NDUxMkExMy4yNzAxMiwxMy4yNzAxMiwwLDAsMSw3MS41OTUyNCw5NUgxOC4yNTQ5MUExMy4yNzAxMiwxMy4yNzAxMiwwLDAsMSw1LDgxLjc0NTEyVjI4LjQwNTI4QTEzLjI3MDEyLDEzLjI3MDEyLDAsMCwxLDE4LjI1NDkxLDE1LjE1MDRINTBhMi41LDIuNSwwLDAsMSwwLDVIMTguMjU0OTFBOC4yNjQyMyw4LjI2NDIzLDAsMCwwLDEwLDI4LjQwNTI4VjgxLjc0NTEyQTguMjY0MjQsOC4yNjQyNCwwLDAsMCwxOC4yNTQ5MSw5MEg3MS41OTUyNGE4LjI2NDIzLDguMjY0MjMsMCwwLDAsOC4yNTQ4OC04LjI1NDg5VjUwYTIuNSwyLjUsMCwwLDEsNSwwWk04OS4xNDg0Niw2LjIzNzkyYTQuMjI2NjEsNC4yMjY2MSwwLDAsMC01Ljk3NzI5LDBsLTMzLjk2MjksMzMuOTYzTDU5Ljc5OTE2LDUwLjc5MTc2bDMzLjk2Mjg5LTMzLjk2M2E0LjIyNjUzLDQuMjI2NTMsMCwwLDAsMC01Ljk3NzIzWk00My42MjM4LDU4LjMxMjg3bDEzLjAwOTQtNC4zNTUxNkw0Ni4wNDIyNiw0My4zNjY4M2wtNC4zNTUxLDEzLjAwOTRBMS41MzAwNSwxLjUzMDA1LDAsMCwwLDQzLjYyMzgsNTguMzEyODdaIj48L3BhdGg+PC9zdmc+" /></a>
            </span>`;
        } else if ( !data.hash.board ) {
            boardName = /*html*/`<span class="navbar-item">Boards</span>`;
        }

        return /*html*/`
        <nav class="navbar is-light" role="navigation" aria-label="main navigation">
            <div class="navbar-brand">
                <a class="navbar-item" href="#">
                    <img alt="boards" style="width:24px; height: 24px;" src="data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9JzMwMHB4JyB3aWR0aD0nMzAwcHgnICBmaWxsPSIjMDAwMDAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2OCA0OCIgeD0iMHB4IiB5PSIwcHgiPjxwYXRoIGZpbGw9IiMwMDAwMDAiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTcyLDgwNiBMMTA3LDgwNiBDMTA4LjEwNDU2OSw4MDYgMTA5LDgwNi44OTU0MzEgMTA5LDgwOCBMMTA5LDgzMiBDMTA5LDgzMy4xMDQ1NjkgMTA4LjEwNDU2OSw4MzQgMTA3LDgzNCBMNzIsODM0IEM3MC44OTU0MzA1LDgzNCA3MCw4MzMuMTA0NTY5IDcwLDgzMiBMNzAsODA4IEM3MCw4MDYuODk1NDMxIDcwLjg5NTQzMDUsODA2IDcyLDgwNiBaIE0xMTIsODIyIEwxMTIsODIyIEwxMTIsODA4IEMxMTIsODA1LjIzODU3NiAxMDkuNzYxNDI0LDgwMyAxMDcsODAzIEw5Niw4MDMgTDk2LDc4OCBDOTYsNzg2Ljg5NTQzMSA5Ni44OTU0MzA1LDc4NiA5OCw3ODYgTDEyMiw3ODYgQzEyMy4xMDQ1NjksNzg2IDEyNCw3ODYuODk1NDMxIDEyNCw3ODggTDEyNCw4MjAgQzEyNCw4MjEuMTA0NTY5IDEyMy4xMDQ1NjksODIyIDEyMiw4MjIgTDExMiw4MjIgWiBNODQsODAzIEw3Miw4MDMgQzY5LjIzODU3NjMsODAzIDY3LDgwNS4yMzg1NzYgNjcsODA4IEw2Nyw4MTcgTDU4LDgxNyBDNTYuODk1NDMwNSw4MTcgNTYsODE2LjEwNDU2OSA1Niw4MTUgTDU2LDc5MSBDNTYsNzg5Ljg5NTQzMSA1Ni44OTU0MzA1LDc4OSA1OCw3ODkgTDgyLDc4OSBDODMuMTA0NTY5NSw3ODkgODQsNzg5Ljg5NTQzMSA4NCw3OTEgTDg0LDgwMyBaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNTYgLTc4NikiPjwvcGF0aD48L3N2Zz4=" />
                </a>
                ${boardName}
                <span id="loader-mobile" class="navbar-item" style="position: relative; margin-left: auto;">
                    <div id="loader" class="button is-text ${data.loading ? 'is-loading' : ''}"></div>
                </span>

                <a id="burger-mobile" role="button" class="navbar-burger" aria-label="menu" aria-expanded="false">
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                </a>

            </div>

            <div class="navbar-menu is-active">
                <!--<div class="navbar-start">
                    ${boardName}
                </div>-->
                <div class="navbar-end">
                    
                    <span id="loader-desktop" class="navbar-item">
                        <div id="loader" class="button is-text ${data.loading ? 'is-loading' : ''}"></div>
                    </span>
                    <a class="navbar-item has-text-right" data-onclick="addPinModal.open">
                        <span class="is-hidden-desktop">Add Pin</span>    
                        <img alt="add pin" style="width:24px;height:24px; margin-top:4px;" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' data-name='Layer 1' viewBox='0 0 100 125' x='0px' y='0px'%3E%3Ctitle%3EArtboard 164%3C/title%3E%3Cpath d='M56.77,3.11a4,4,0,1,0-5.66,5.66l5.17,5.17L37.23,33A23.32,23.32,0,0,0,9.42,36.8L7.11,39.11a4,4,0,0,0,0,5.66l21.3,21.29L3.23,91.23a4,4,0,0,0,5.66,5.66L34.06,71.72l21,21a4,4,0,0,0,5.66,0l2.31-2.31a23.34,23.34,0,0,0,3.81-27.82l19-19,5.17,5.18a4,4,0,0,0,5.66-5.66Zm1.16,81.16L15.61,42a15.37,15.37,0,0,1,21.19.51L57.42,63.08A15.39,15.39,0,0,1,57.93,84.27Zm4-28L43.59,37.94,61.94,19.59,80.28,37.94Z'/%3E%3C/svg%3E"/>
                    </a>
                    <a class="navbar-item has-text-right">
                        <span class="is-hidden-desktop">Sign Out</span>
                        <img alt="sign out" width="32" height="32" src="data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9JzMwMHB4JyB3aWR0aD0nMzAwcHgnICBmaWxsPSIjMDAwMDAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGRhdGEtbmFtZT0iTGF5ZXIgMSIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHg9IjBweCIgeT0iMHB4Ij48dGl0bGU+QXJ0Ym9hcmQgODQ8L3RpdGxlPjxnPjxwYXRoIGQ9Ik0yOCw4MkgzOFY3NEgyOGEyLDIsMCwwLDEtMi0yVjI4YTIsMiwwLDAsMSwyLTJIMzhWMThIMjhBMTAsMTAsMCwwLDAsMTgsMjhWNzJBMTAsMTAsMCwwLDAsMjgsODJaIj48L3BhdGg+PHBhdGggZD0iTTY2LDMyLjM0LDYwLjM0LDM4bDgsOEgzNHY4SDY4LjM0bC04LDhMNjYsNjcuNjYsODAuODMsNTIuODNhNCw0LDAsMCwwLDAtNS42NloiPjwvcGF0aD48L2c+PC9zdmc+" />
                    <a>
                </div>
            </div>
        </nav>
        `;

    }

}); });