function restoreOptions(){
    chrome.storage.sync.get({
        server: 'http://localhost:3000'
    }, function(items){
        document.getElementById('server').value = items.server;
    });
}

function saveOptions(){
    let server = document.getElementById('server').value;

    chrome.storage.sync.set({
        server: server
    }, function(){
        let status = document.getElementById('status');
        status.innerText = 'Options saved.';
        setTimeout(function(){
            status.innerText = '';
        }, 1000);
    });
}


document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);