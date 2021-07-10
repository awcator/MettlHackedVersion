/**
 * Created by mayuresh on 29/11/16.
 */

var port = chrome.runtime.connect(chrome.runtime.id);

port.onMessage.addListener(function(msg) {
    window.postMessage(msg, '*');
});

port.onDisconnect.addListener(function (event) {
    window.postMessage({ type: 'SS_UI_DISCONNECTED'}, '*');
});

window.addEventListener('message', function(event) {
    // We only accept messages from ourselves
    if (event.source != window) return;

    if (event.data.type) {
        port.postMessage(event.data);
    }

}, false);

window.postMessage({ type: 'SS_UI_HELLO' }, '*');

