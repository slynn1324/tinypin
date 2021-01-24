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