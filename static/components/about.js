app.addSetter('aboutModal.open', (data) => {
    data.aboutModal.active = true;
});

app.addSetter('aboutModal.close', (data) => {
    data.aboutModal.active = false;
});

app.addComponent('aboutModal', (store) => { return new Reef("#aboutModal", {
    store: store,
    template: (data) => {
        return /*html*/`
        <div class="modal ${data.aboutModal.active ? 'is-active' : ''}">
            <div class="modal-background" data-onclick="aboutModal.close"></div>
            <div class="modal-content">
                <div class="box" style="font-family: monospace;">
                    <h1><strong>tinypin</strong></h1>
                    <div>
                        <a href="https://www.github.com">github.com/slynn1324/tinypin</a>
                        <br />
                        &nbsp;
                    </div>
                    <div>
                        <h2><strong>credits</strong></h2>
                        client
                        <br />
                        &nbsp;css framework &raquo; <a href="https://www.bulma.io">bulma.io</a>
                        <br />
                        &nbsp;ui framework &raquo; <a href="https://reefjs.com">reef</a>
                        <br />
                        &nbsp;boards icon &raquo; <a href="https://thenounproject.com/term/squares/1160031/">squares by Andrejs Kirma from the Noun Project</a>
                        <br />
                        &nbsp;pin icon &raquo; <a href="https://thenounproject.com/term/pinned/1560993/">pinned by Gregor Cresnar from the Noun Project</a>
                        <br />
                        &nbsp;web icon &raquo; <a href="https://thenounproject.com/term/website/2868662/">website by Supriadi Sihotang from the Noun Project</a>
                        <br />
                        &nbsp;edit icon &raquo; <a href="https://thenounproject.com/term/edit/3122457/">edit by TTHNga from the Noun Project</a>
                        <br />
                        &nbsp;logout icon &raquo; <a href="https://thenounproject.com/term/log-out/3556472">Log Out by Gregor Cresnar from the Noun Project</a>
                        <br />
                        &nbsp;trash icon &raquo; <a href="https://thenounproject.com/term/trash/2449397/">Trash by ICONZ from the Noun Project</a>
                        <br />
                        server
                        <br />
                        &nbsp;language &amp; runtime &raquo; <a href="https://nodejs.org/en/">node.js</a>
                        <br />
                        &nbsp;database &raquo; <a href="https://www.sqlite.org/index.html">sqlite</a>
                        <br />
                        &nbsp;library &raquo; <a href="https://www.npmjs.com/package/better-sqlite3">better-sqlite3</a>
                        <br />
                        &nbsp;library &raquo; <a href="https://www.npmjs.com/package/express">express</a>
                        <br />
                        &nbsp;library &raquo; <a href="https://www.npmjs.com/package/body-parser">body-parser</a>
                        <br />
                        &nbsp;library &raquo; <a href="https://www.npmjs.com/package/node-fetch">node-fetch</a>
                        <br />
                        &nbsp;library &raquo; <a href="https://www.npmjs.com/package/sharp">sharp</a>
                    </div>
                </div>
            </div>
            <button class="modal-close is-large" aria-label="close" data-onclick="aboutModal.close"></button>
        </div>
        `;
    }
}); });
