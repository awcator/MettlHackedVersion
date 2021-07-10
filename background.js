/*
 chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {

 console.log("New message arrived ", message);
 console.log("Sender name ", sender);
 console.log("Send Response is ", sendResponse);

 chrome.desktopCapture.chooseDesktopMedia(
 ["screen", "window"],
 function (id) {
 sendResponse({"id": id});
 });
 });
 */


var data_sources = ["screen", "window", "tab"],
    desktopMediaRequestId = '';

chrome.runtime.onConnect.addListener(function (port) {

    port.onMessage.addListener(function (msg) {

        console.log("new message arrived", msg);

        if (msg.type === "SS_UI_PING") {
            msg.type = 'SS_UI_PONG';
            msg.version = chrome.runtime.getManifest().version;
            sendDisplayInfo(port, msg);
        }

        if (msg.type === 'SS_UI_REQUEST') {
            requestScreenSharing(port, msg);
        }

        if (msg.type === 'SS_UI_CANCEL') {
            cancelScreenSharing(msg);
        }

        if (msg.type === 'SS_DISPLAY_INFO') {
            sendDisplayInfo(port, msg);
        }

        if (msg.type === 'SS_UI_UPDATE') {
            chrome.runtime.requestUpdateCheck(function(status){
              //   if (status === "update_available") {
                    msg.type = "SS_UI_UPDATE_AVAILABLE";
                    msg.status =status;
                    sendMessage(port,msg);
                    chrome.runtime.reload();
                // }
            });
        }
    });

    chrome.system.display.onDisplayChanged.addListener(function () {
        //console.log("change in display found");
        //sendDisplayInfo(port, {type : "SS_DISPLAY_CHANGED"});
    });

});


function sendDisplayInfo(port, msg) {
    chrome.system.display.getInfo(function (layout) {
        msg['layout'] = layout;
        sendMessage(port, msg);
    });
}

function sendMessage(port, msg) {
    port.postMessage(msg);
    console.log("------abcd>");
    console.log(msg);
}

function requestScreenSharing(port, msg) {
    // https://developer.chrome.com/extensions/desktopCapture
    // params:
    //  - 'data_sources' Set of sources that should be shown to the user.
    //  - 'targetTab' Tab for which the stream is created.
    //  - 'streamId' String that can be passed to getUserMedia() API

    var tab = port.sender.tab;
    tab.url = msg.url;

    //cancelScreenSharing();

    desktopMediaRequestId = chrome.desktopCapture.chooseDesktopMedia(data_sources, tab, function (streamId) {

        console.log('----------------->Success of choose desktop media', streamId);

        if (streamId) {
            msg.type = 'SS_DIALOG_SUCCESS';
            msg.streamId = streamId;
        } else {
            msg.type = 'SS_DIALOG_CANCEL';
        }
		
		sendMessage(port,msg);
        //port.postMessage(msg);

    });
}

function cancelScreenSharing(msg) {
    // cancelChooseDesktopMedia crashes on the Mac
    // See: http://stackoverflow.com/q/23361743/980524
    if (desktopMediaRequestId) {
        try {
            chrome.desktopCapture.cancelChooseDesktopMedia(desktopMediaRequestId);
        } catch (e) {
            console.log("error occurred while canceling screen sharing", e);
        }
    }
}

/*
 chrome.windows.getAll({
 populate: true
 }, function (windows) {
 var details = {file: 'js/content.js', allFrames: true},
 currentWindow;

 for (var i = 0; i < windows.length; i++) {
 currentWindow = windows[i];
 var currentTab;

 for (var j = 0; j < currentWindow.tabs.length; j++) {
 currentTab = currentWindow.tabs[j];
 // Skip chrome:// pages
 if (!currentTab.url.match(/(chrome):\/\//gi)) {
 // https://developer.chrome.com/extensions/tabs#method-executeScript
 chrome.tabs.executeScript(currentTab.id, details, function () {
 console.log('Injected content script.');
 });
 }
 }
 }
 });
 */

/*
 Additional listener on extension
 */

chrome.runtime.onInstalled.addListener(function (id) {
    sendMessage(id, 'SS_EXTENSION_INSTALLED');
});

chrome.runtime.onStartup.addListener(function (id) {
    sendMessage(id, 'SS_EXTENSION_STARTED');
});

chrome.runtime.onSuspend.addListener(function (id) {
    sendMessage(id, 'SS_EXTENSION_SUSPENDED');
});



