console.log("XXX hi");

var debug = 8;
console.log("debug is " + debug);

// is the post id available to us?


//const now = new Date();
const offset = new Date().getTimezoneOffset()


function get_24hour_local_datetime(n = null) {
    if (!n)
	n = new Date();
    var yy = String( n.getFullYear() );
    var mm = String (n.getMonth()+1).padStart(2,0);
    var dd = String (n.getDate()   ).padStart(2,0);
    
    var h = String( n.getHours()   ).padStart(2,0);
    var m = String( n.getMinutes() ).padStart(2,0);
    var s = String( n.getSeconds() ).padStart(2,0);
    return `${yy}-${mm}-${dd} ${h}:${m}:${s}`
    // TODO: compare padstart to hpad below
    
}

function tz_offset_to_str(minutes) {
    // TODO: check interpolation efficiency
    var sign = "-";
    if (minutes < 0) {
	sign = "+";
	minutes = -minutes;
    }
    var h = minutes / 60;
    var hpad = (h < 10) ? "0" : "";
    var m = minutes % 60;
    var mpad = (m < 10) ? "0" : "";
    var ret = `${sign}${hpad}${h}:${mpad}${m}`;
    if (ret.length != 6) {
	// console.log("timezone error!"); // where does this error go?
    }
    return ret;
}

// internal to friendly date
// unused?
function i2f(str) {
    console.log("internal is " + str);
    var d = new Date(str);
    console.log("d is " + d);
    console.log(d);
    return get_24hour_local_datetime( new Date(str) );
    //return str.replace('T', ' ');
}

function f2i(str) {
    var d = new Date();
    console.log(d);
    var now_tz = str.replace(' ', 'T') + tz_offset_to_str( d.getTimezoneOffset() );
    console.log(now_tz);
    var e = new Date(now_tz);     // TODO: make sure this parses!
    console.log(e);
    return e.toISOString();

}
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
	document.getElementById("newTime").value = i2f(x.lastread);
    });

// which of these two async functions is called first?

function setOption(blob) { // key, value) {
//    console.log(`setting ${key} to ${value}`);
    chrome.storage.local.set( blob ); // { key: value });
}

function setOption(key, value) {
    var blob = new Object;
    blob[key] = value;
    console.log(`setting ${key} to ${value}`);
    chrome.storage.local.set( blob ) ;
}

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
	//	setOption({ debug : checkbox.checked ? 1 : 0});
	var blob = { debug: checkbox.checked ? 1 : 0  }
	//chrome.storage.local.set( blob );
//	setOption( blob );
	setOptionKV ( "debug", checkbox.checked ? 1 : 0  );
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

    var newTime = document.getElementById("newTime");
    var button = document.getElementById("now");
    button.addEventListener("click", function() {
	console.log("pressed now");
	var d = new Date();
	newTime.value = get_24hour_local_datetime();
	//newTime.value = i2f(d.toISOString());
	// trigger setting?
    });

    function setTime() {
	console.log("date is changed, now " + newTime.value);
	// TODO: verify valid here
	setOption("lastread", f2i(newTime.value));
    }

    newTime.addEventListener("change", setTime);
    document.getElementById("gotime").addEventListener("click", setTime);

    document.getElementById( "checknow" ).addEventListener("click", function() {
	setOption("checknow", Date.now());
	// TODO: disable in UI for X seconds
    });

}
