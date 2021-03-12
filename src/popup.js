console.log("XXX hi");

console.log("chrome.storage is " + chrome.storage);
console.log(chrome.storage);

console.log("chrome.storage.local is " + chrome.storage.local);
console.log(chrome.storage.local);

console.log("chrome.storage.local.get is " + chrome.storage.local.get);
console.log(chrome.storage.local.get);

chrome.storage.local.get("kitten", function(items){
  console.log(items.kitten);  // -> {name:"Mog", eats:"mice"}
});

var debug = 8;
console.log("debug is " + debug);


var xxx = chrome.storage.local.get(
    [ "debug", "likes", "reload", "sort"], function(x) {
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



window.onload  = function() {
    console.log("finding it");
    var checkbox =  document.getElementById("settingDebug") ;

    console.log(123);
    console.log ( checkbox );

    console.log("checkbox is checked was " + checkbox.checked);
    console.log("debug is " + debug);
    checkbox.checked = (debug == 1);
//    document.getElementbyId
    checkbox.addEventListener("change",  function() {
	console.log("value changed!");
	chrome.storage.local.set({
	    debug: checkbox.checked ? 1 : 0
	});
    });
    //
    var cbLikes =  document.getElementById("settingLikes");
    cbLikes.addEventListener("change", function() {
	console.log("like changed to " + cbLikes.checked);
	chrome.storage.local.set({
	    likes: cbLikes.checked ? 1 : 0
	});
    });

    var cbReload =  document.getElementById("settingReload");
    cbReload.addEventListener("change", function() {
	chrome.storage.local.set({
	    reload: cbReload.checked ? 1 : 0
	});
    });

    var ddSort =  document.getElementById("settingSort");
    ddSort.addEventListener("change", function() {
	console.log("ddSort changed to " + ddSort.value);
	chrome.storage.local.set({
	    sort: ddSort.value
	});
    });
}
