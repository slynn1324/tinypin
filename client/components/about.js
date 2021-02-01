app.addSetter('aboutModal.open', (data) => {
    data.aboutModal.active = true;
});

app.addSetter('aboutModal.close', (data) => {
    data.apiKey = null;
    data.showApiKey = false;
    data.aboutModal.active = false;
});

app.addSetter('about.showApiKey', async (data, apiKey) => {
    data.apiKey = apiKey;
    data.showApiKey = true;
});

async function showApiKey(){
    let result = await fetch("/api/apikey");
    let json = await result.json();
    let apiKey = json.apiKey;
    store.do('about.showApiKey', encodeURIComponent(apiKey));
}

app.addComponent('aboutModal', (store) => { return new Reef("#aboutModal", {
    store: store,
    template: (data) => {

        let apiKeyElement = "";
        if ( data.showApiKey ){
            apiKeyElement = /*html*/`
            <div>
                <h2><strong>api key for ${data.user.name}:</strong></h2>
                <input value="${data.apiKey}" style="width: 100%">
                <br /><br />
            </div>
            `;
        }

        return /*html*/`
        <div class="modal ${data.aboutModal.active ? 'is-active' : ''}">
            <div class="modal-background" data-onclick="aboutModal.close"></div>
            <div class="modal-content">
                <div class="box" style="font-family: monospace;">
                    <div class="level mb-0">
                        <div class="level-left">
                            <h1><strong>tinypin</strong></h1>
                        </div>
                        <div class="level-right">
                            <a data-onclick-x="showApiKey">show api key</a>
                        </div>
                    </div>
                    <div>
                        <a href="https://www.github.com">github.com/slynn1324/tinypin</a>
                        <br />
                        build: ${data.user ? data.user.version : 'unknown'}
                        <br />
                        &nbsp;
                    </div>

                    ${apiKeyElement}

                    <div>
                        <h2><strong>credits</strong></h2>
                        client
                        <br />
                        &nbsp;css framework &raquo; <a href="https://www.bulma.io">bulma.io</a>
                        <br />
                        &nbsp;ui framework &raquo; <a href="https://reefjs.com">reef</a>
                        <br />
                        &nbsp;pin zoom &raquo; <a href="https://sachinchoolur.github.io/lightgallery.js/">lightgallery.js</a>
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
                        &nbsp;missing icon &raquo; <a href="https://materialdesignicons.com/icon/dots-square">dots-square by Jeff Hilnbrand</a>
                        <br />
                        &nbsp;hidden icon &raquo; <a href="https://thenounproject.com/term/hidden/3543981/">hidden by vittorio longo from the Noun Project</a>
                        <br />
                        &nbsp;about icon &raquo; <a href="https://thenounproject.com/term/info/3495259/">Info by Sriti Chamola from the Noun Project</a>
                        <br />
                        &nbsp;link icon &raquo; <a href="https://thenounproject.com/term/link/1880307/">link by Hassan ali from the Noun Project</a>
                        <br />
                        &nbsp;download icon &raquo; <a href="https://thenounproject.com/term/download/2120379/">Download by Yoyo from the Noun Project</a>
                        <br />
                        &nbsp;share icon &raquo; <a href="https://thenounproject.com/term/share/1058858/">Share by Тимур Минвалеев from the Noun Project</a>
                        <br />
                        &nbsp;done icon &raquo; <a href="https://thenounproject.com/term/done/587164/">done by Viktor Ostrovsky from the Noun Project</a>
                        <br />
                        &nbsp;settings icon &raquo; <a href="https://thenounproject.com/term/settings/3291880/">setting by LUTFI GANI AL ACHMAD from the Noun Project</a>

                        <br />
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
                        &nbsp;library &raquo; <a href="https://www.npmjs.com/package/cookie-parser">cookie-parser</a>
                        <br />
                        &nbsp;library &raquo; <a href="https://www.npmjs.com/package/node-fetch">node-fetch</a>
                        <br />
                        &nbsp;library &raquo; <a href="https://www.npmjs.com/package/sharp">sharp</a>
                        <br />
                        &nbsp;library &raquo; <a href="https://www.npmjs.com/package/yargs">yargs</a>
                    </div>
                </div>
            </div>
            <button class="modal-close is-large" aria-label="close" data-onclick="aboutModal.close"></button>
        </div>
        `;
    }
}); });
