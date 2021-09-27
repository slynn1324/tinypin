# tinypin

A self-hosted, minimalistic image collection board.  

# screenshots

## desktop
![desktop screenshot](/screenshots/desktop.jpg?raw=true "desktop")
![desktop zoom screenshot](/screenshots/desktop-zoom.jpg?raw=true "desktop zoom")

## iPhone
<image src="/screenshots/ios.jpg?raw=true" width="200" height="433" alt="ios screenshot" />
<image src="/screenshots/ios-zoom.jpg?raw=true" wdith="200" height="433" alt="ios zoom screenshot" />


# running

```
git clone https://github.com/slynn1324/tinypin.git
cd tinypin
npm install
node main.js
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

https://chrome.google.com/webstore/detail/add-to-tinypin/ehdpchlgmoafibdpmimgigogcgmebfpa

or 

- visit `chrome://extensions`
- enable developer mode
- click `Load Unpacked`
- chose the `chrome-extension` folder
- click `details` for the `add to tinypin` extension
- click `extension options`
- update the url for your tinypin installation


# ios shortcuts

adding these ios shortcuts enables native app-link share-sheet integration
(hopefully these work - new to this whole shortcut thing)

add to tinypin
https://www.icloud.com/shortcuts/0f096fafcad14b028c1ce4ffd5960216

upload to tinypin
https://www.icloud.com/shortcuts/87d8c6993c644dc181f220f6a736340d

Open In (note: this must currently be named exactly 'Open In' for the in app share button to work.)
https://www.icloud.com/shortcuts/a129342e79ff40ef9e63c94c73ffaa50



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
- edit icon > [edit by TTHNga from the Noun Project](https://thenounproject.com/term/edit/3122457/)
- logout icon > [Log Out by Gregor Cresnar from the Noun Project](https://thenounproject.com/term/log-out/3556472/)
- trash icon > [Trash by ICONZ from the Noun Project](https://thenounproject.com/term/trash/2449397/)
- missing icon > [dots-square by Jeff Hilnbrand](https://materialdesignicons.com/icon/dots-square)
- hidden icon > [hidden by vittorio longo from the Noun Project](https://thenounproject.com/term/hidden/3543981/)
- about icon > [Info by Sriti Chamola from the Noun Project](https://thenounproject.com/term/info/3495259/)
- link icon > [link by Hassan ali from the Noun Project](https://thenounproject.com/term/link/1880307/)
- download icon > [Download by Yoyo from the Noun Project](https://thenounproject.com/term/download/2120379/)
- share icon > [Share by Тимур Минвалеев from the Noun Project](https://thenounproject.com/term/share/1058858/)
- done icon > [done by Viktor Ostrovsky from the Noun Project](https://thenounproject.com/term/done/587164/)
- settings icon > [setting by LUTFI GANI AL ACHMAD from the Noun Project](https://thenounproject.com/term/settings/3291880/)

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

## buy me a beer

If you find this useful and feel so inclinced, https://paypal.me/slynn1324.  Otherwise, simply enjoy. 
