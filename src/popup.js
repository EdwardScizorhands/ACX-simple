console.log("XXX hi");

console.log("chrome.storage is " + chrome.storage);
console.log(chrome.storage);

console.log("chrome.storage.local is " + chrome.storage.local);
console.log(chrome.storage.local);

console.log("chrome.storage.local.get is " + chrome.storage.local.get);
console.log(chrome.storage.local.get);

chrome.storage.local.set({
  kitten:  {name:"Mog", eats:"mice"},
  monster: {name:"Kraken", eats:"people"}
});

chrome.storage.local.get("kitten", function(items){
  console.log(items.kitten);  // -> {name:"Mog", eats:"mice"}
});

//console.log("chrome.storage.local.get('a') is " + chrome.storage.local.get('a'));
//console.log(chrome.storage.local.get('a'));

//console.log(chrome.storage.local.set('a', 'bob'));

var debug = 8;
console.log("debug is " + debug);

var xxx = chrome.storage.local.get("debug", function(x) {
    console.log("sync get: x is " + x);
    console.log(x);
    console.log(x["debug"]);
    console.log(x.debug);
    debug = x.debug;
    console.log("debug is now " + debug);


    var checkbox =  document.getElementById("settingDebug");
    checkbox.checked = (debug == 1);
    
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
}
