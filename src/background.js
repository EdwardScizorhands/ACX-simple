
// chrome (and firefox) could redirect to this built-in page.
var page = chrome.runtime.getURL("simple2.html");
console.log(page);
var background_debug = 1;
var try_debugger = false; // this is quite difficult to use right, if
			  // possible at all
var total_replace = true;

ext = chrome ? chrome : browser;

var a = 0;
var b = 0;

if (try_debugger && chrome.debugger) {
    console.log("we have the chrome debugger!");
    
    chrome.debugger.getTargets(
	function(targets) {
	    console.log("length of targets is " + targets.length);
	    for (var t in targets) {
		var target = targets[t];
		
		var url = target.url;
		if (url.indexOf("astral") > -1) {
		    console.log(target);
		}
		if (//<target.attached &&
		    url.indexOf("astral") > -1) {
//		    console.log("UUUUUU");
//		    console.log(target);
		    //alert(target);
		    var id = target.id;
		    var debuggee = { targetId: id };
		    // fails because we aren't attached?
		    //var ttt = chrome.debugger.sendCommand(debuggee, "Network.setRequestInterceptionEnabled", { enabled: true });
		    ///console.log("ttt is " + ttt);
		    ///console.log(ttt);
		    if (true) {
			chrome.debugger.attach(debuggee, "1.2", () => {
			    //chrome.debugger.sendCommand(debuggee, "Network.setRequestInterceptionEnabled", { enabled: true });
			});
			chrome.debugger.detach(debuggee, function() {
			    console.log("DETACH");
			})
			
		    }
		}
	    }
	}
    );
}


ext.webRequest.onBeforeRequest.addListener(
    function(x) {

	if (total_replace) {
	    console.log("redirect on " + x + " ?");
	    if (x.url.match(/^https:\/\/.*\.substack.com.p\/.*\/simple/) ||
		x.url.match(/^https:\/\/.*\.substack.com.p\/.*\/comments/)) {
		return { redirectUrl: page + "?page=" + x.url };
	    };
	}
	
	
	if (background_debug) {
	    console.log("BEFORE REQUEST");
	    console.log(x);
	}
	console.log(x.url);
	if (x.url.match(/^https:\/\/.*\.substack.com.p\/.*\/simple/) ||
	    x.url.match(/^https:\/\/.*\.substack.com.p\/.*\/comments/)) {
	    console.log("killing itt");
	} else {
	    return {};
	};
	
	if (ext.webRequest.filterResponseData) {
	    // we are on firefox, thank god
	    //	    let decoder = new TextDecoder("utf-8");
	    let filter = ext.webRequest.filterResponseData(x.requestId);
	    let encoder = new TextEncoder();
	    var n_writes = 0;
	    
	    filter.ondata = event => {
		if (background_debug) {
		    console.log("event is " + event);
		    console.log(event);
		}
		// let str = decoder.decode(event.data, {stream: true});
		// var len = str.length;
		// console.log("replacing " + b + " " + new Date() + " " + len + " " + str.substring(0,10) + "..." + str.substring(len-10));
		n_writes += 1;
		if (n_writes == 1) {
		    filter.write(encoder.encode("<h1>Loading... " + n_writes + "</h1>"));
		}
		// TODO: make this only write once
	    }
	    filter.onstop = event => {
		filter.close();
	    }
	    
	    return {};
	}

	console.log("x is " + x);
	console.log(x);
	// kill script loading, if we couldn't kill the whole page
	if (x.url.startsWith("https://cdn.substack.com/") 
	    // ||
	    // x.url.startsWith("https://unpkg.com/") ||
	    // x.url.startsWith("https://cdn.optimizely.com/")
	   ) {
	    alert("blocking");
	    console.log("CDN is " + x.url.substring(0,15) + ", kill it");
	    return {cancel: true};
	} else if (x.url.startsWith("chrome-extension://")) {
	    console.log("ok2");
	    return {cancel: false};
	} else if (x.url.startsWith("https://astralcodexten.substack.com/api/v1/post/")) {
	    console.log("ok1");
	    return {cancel: false};
	} else {
	    console.log("XXXXXXXX unknown! " + x.url);
	}
    },
    {
	urls: [ "<all_urls>" ],   //. this is too broad! tighten up
	types: ["main_frame"] // I need this here on Firefox, or else to change the frame type above
    },
    ['blocking']
);

if (false)  {
    // I think this sucks. I'm trying to stop other stuff from loading.
    // Probably should throw it all in the trash.
chrome.webRequest.onBeforeSendHeaders.addListener(
    function(x) {
	console.log("BEFORE SEND HEADERS");

	// Is there a header I can send that tells the server not to
	// respond?
	// Host: causes a dead connection in Chrome/Brave.
	console.log(JSON.stringify(x.requestHeaders));
//	return;
	var rh = x.requestHeaders;
	if (rh.length > 0) {
	    console.log("modified");
	    rh[0].name = "Host";
	    rh[0].value = "example.com";
	}
	console.log(JSON.stringify(x.requestHeaders));
	return {requestHeaders: rh};

	/*
	if (x.url.startsWith("https://cdn.substack.com/")) {
	    console.log("CDN, kill it");
	    return {cancel: true};
	} else if (x.url.startsWith("chrome-extension://")) {
	    console.log("ok2");
	    return {cancel: false};
	} else if (x.url.startsWith("https://astralcodexten.substack.com/api/v1/post/")) {
	    console.log("ok1");
	    return {cancel: false};
	}
	
	*/

    },
    {
	urls: [ "<all_urls>" ]   //. this is too broad! tighten up
    },
    ['blocking', 'requestHeaders' ]
);
}

console.log(2);
