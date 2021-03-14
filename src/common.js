
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
