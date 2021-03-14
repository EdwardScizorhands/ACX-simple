console.log("XXX hi");

var debug = 8;
console.log("debug is " + debug);

// is the post id available to us?

var xxx = chrome.storage.local.get(
    [ "debug", "likes", "reload", "sort", "lastread"], function(x) {
	console.log("sync get: x is " + x);
	console.log(x);
	console.log(x["debug"]);
	console.log(x.debug);
	debug = x.debug;
	console.log("debug is now " + debug);
	
	var cbDebug =  document.getElementById("settingDebug");
	cbDebug.checked = (debug == 1);
	var cbLikes =  document.getElementById("settingLikes");
	cbLikes.checked = (x.likes == 1);
	var cbReload = document.getElementById("settingReload");
	cbReload.checked = !(x.reload == 0); // default true
	var ddSort = document.getElementById("settingSort");
	ddSort.value = (x.sort ? x.sort : "new"); // default new
    });

// which of these two async functions is called first?

function setOption(blob) { // key, value) {
    console.log("setting " + blob);
    chrome.storage.local.set( blob ); // { key: value });
}

function setOption(key, value) {
    var blob = new Object;
    blob[key] = value; 
    console.log(`setting ${key} to ${value}`);
    chrome.storage.local.set( blob ) ;
}

window.onload  = function() {
    var checkbox =  document.getElementById("settingDebug") ;

    console.log("checkbox is checked was " + checkbox.checked);
    console.log("debug is " + debug);
    checkbox.checked = (debug == 1);
    checkbox.addEventListener("change",  function() {
	console.log("value changed!");
	var blob = { debug: checkbox.checked ? 1 : 0  }
	setOption( blob );
    });
    //
    var cbLikes =  document.getElementById("settingLikes");
    cbLikes.addEventListener("change", function() {
	console.log("like changed to " + cbLikes.checked);
	setOption("likes", cbLikes ? 1 : 0);
    });
    

    var cbReload =  document.getElementById("settingReload");
    cbReload.addEventListener("change", function() {
	setOption("reload", cbReload.checked ? 1 : 0);
    });

    var ddSort =  document.getElementById("settingSort");
    ddSort.addEventListener("change", function() {
	console.log("ddSort changed to " + ddSort.value);
	setOption("sort", ddSort.value);
    });

    document.getElementById( "checknow" ).addEventListener("click", function() {
	setOption("checknow", Date.now());
	// TODO: disable in UI for X seconds
    });

}
