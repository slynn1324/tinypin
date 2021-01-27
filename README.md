# tinypin

A self-hosted, minimalistic image collection board.  

# running

```
git clone https://github.com/slynn1324/tinypin.git
cd tinypin
npm install
node server.js
```

## docker
```
docker run -d --name tinypin -p 3000:3000 -v "$(pwd)/data:/data" --restart=unless-stopped slynn1324/tinypin
```

### building
Feel free to build your own docker images, maybe with your own customizations. 

```
git clone https://github.com/slynn1324/tinypin.git
cd tinypin
docker build -t tinypin .
```
or
```
./docker-build.sh
```

# chrome extension

- visit `chrome://extensions`
- enable developer mode
- click `Load Unpacked`
- chose the `chrome-extension` folder
- click `details` for the `add to tinypin` extension
- click `extension options`
- update the url for your tinypin installation

I'll see about publishing it in time.... 

# security

There is trivial security on the web pages to allow for multiple user support.  I make no claim to the robustness of the security for the content nor the hashed credential storage in the database.  Additional layers of security should be considered before exposing the application to the internet.  

# credits

## client

- css framework > [bulma.io](https://www.bulma.io)
- js framework > [reef](https://reefjs.com)
- pin zoom > [lightgallery.js](https://sachinchoolur.github.io/lightgallery.js/)
- boards icon > [squares by Andrejs Kirma from the Noun Project](https://thenounproject.com/term/squares/1160031/)
- pin icon > [pinned by Gregor Cresnar from the Noun Project](https://thenounproject.com/term/pinned/1560993/)
- web icon > [website by Supriadi Sihotang from the Noun Project](https://thenounproject.com/term/website/2868662/)
- edit icon > [edit by TTHNga from the Noun Project](https://thenounproject.com/term/edit/3122457/
- logout icon > [Log Out by Gregor Cresnar from the Noun Project](https://thenounproject.com/term/log-out/3556472/)
- trash icon > [Trash by ICONZ from the Noun Project](https://thenounproject.com/term/trash/2449397/)
- missing icon > [dots-square by Jeff Hilnbrand](https://materialdesignicons.com/icon/dots-square)
- hidden icon > [hidden by vittorio longo from the Noun Project](https://thenounproject.com/term/hidden/3543981/)
- about icon > [Info by Sriti Chamola from the Noun Project](https://thenounproject.com/term/info/3495259/)

## server

- language & runtime > [node.js](https://nodejs.org/)
- database > [sqlite](https://www.sqlite.org/index.html)
- library > [better-sqlite3](https://www.npmjs.com/package/better-sqlite3)
- library > [express](https://www.npmjs.com/package/express)
- library > [body-parser](https://www.npmjs.com/package/body-parser)
- library > [cookie-parser](https://www.npmjs.com/package/cookie-parser)
- library > [node-fetch](https://www.npmjs.com/package/node-fetch)
- library > [sharp](https://www.npmjs.com/package/sharp)
- library > [yargs](https://www.npmjs.com/package/yargs)
