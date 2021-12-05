
// init_page() and wait_to_init() seems to be unused?
function init_page() {
    console.log("READY TO INIT");
    //var x = $( '#test_new_comment' );
    let x = document.getElementById( 'test_new_comment' );
    console.log("x is " + x);
    console.log(x);
    x.click = make_comment;
    x.onclick = make_comment;
    x.onClick = make_comment;
}
function wait_to_init() {
    console.log("initialing? in new-ui scope");
    var t1 = document.getElementById("title1");
    console.log("t1 is " + t1);
    var t2 = document.getElementById("last");
    console.log("t2 is " + t2);
    if (t1 == null || t2 == null) {
	console.log("not ready yet, try again!");
	setTimeout( wait_to_init, 10);
    } else {
	init_page();
    }

}

function escapeHTML(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}


// hash takes <1ms
function hash_color(str) {
    if (!str) return 0xa0a0a0; // bland gray

    let hash = new Number(0);
    let l = str.length;
    for (let i = 0; i < l; i++) {
        let char = str.charCodeAt(i);
	hash = ((hash*32)-hash) + str.charCodeAt(i);
	hash = hash & 0x7FFFFFFF;
	
    }
    return hash % (256 * 256 * 256);
    
}

function old_eat_page() {
    // This is more complex than it has to be. But it works.
    // TODO: Figure out how to simplify but let it still work.
    console.log("eat page?  " + window.fred);

    window.fred += 1;
    if (debug) {
	console.log("document.head is " + document.head);
    }
    if (window.fred > 200) {
	setTimeout( phase_two, 1);
	return;
    }
    if (document.head != null) {
	console.log("stopping all further loading");
	window.stop(); // we have what we need
    }
    
    // can I inject code into the head to catch any stray functions?
    console.log("jQuery is " + jQuery);
    if (debug && jQuery) {
	console.log("html is " + $("#html") );
	console.log( $("#html") );

    	console.log("document is" + $("document") );
   	console.log( $("document") );
    }
    console.log("document body is " + document.body);
    if (document.body == null) {
//	console.log("debug is " + debug);
	console.log("not loaded yet");
	setTimeout(eat_page, change_icon ? 0: 100);
	return;
    }
    console.log("prep");
    console.log("document body is " + document.body);
    //console.log("document body.innerHTML is " + document.body.innerHTML);
    
    var s = document.body.innerHTML.substring(0,50);
    console.log("CHECKING " + s);
    if (s == "<h1>Loading ACX Simple</h1>") {
	console.log("phase 1 done, go to phase 2");
//	setTimeout( eat_page, 0);
	setTimeout( phase_two, 0);
	return;
    }
    document.head.textContent = ""; // This does nothing, I think.
    document.body.textContent = "";
    var header = document.createElement('h1');
    header.textContent = "Loading ACX Simple";
    document.body.appendChild(header);

    setTimeout(eat_page, 1 * 1000);
}

function comment_order(cs) {

    function sort_new(a, b) { return b.date.localeCompare(a.date); }
    function sort_old(a, b) { return a.date.localeCompare(b.date); }
    function sort_top(a, b) { return b.score - a.score; }
    
    if (sort == "new")
	return cs.sort( sort_new );
    if (sort == "old")
	return cs.sort( sort_old );
    return cs.sort( sort_top );
}



function settings_changed(things) {
    console.log("things is " + things);
    console.log(things);
    let c;
    
    if (c = things.reload) {
	reload_comments = things.reload.newValue;
	console.log("read now set to " + reload_comments);
	// TODO: make sure we don't accidentally set up multiple timers.
	// this also makes us wait the timer instead of checking immediately.
	spin_comments(); 

    } //     // 850 so far
    if (c = things.sort) {
	if (c.oldValue != c.newValue) {
	    console.log("sorted???");
//	    mark_as_new(c.newValue);
	}
    }
    if (c = things.checknow) {
	// TODO: make this timeout bigger but per-tab
	if (c.newValue > c.oldValue + 3000) {
	    load_comments(true);
	} else {
	    console.log("slow down, man");
	}
    }
}

function mark_as_new(time) {
    console.time("marknew");

    let c = 0;
    let n_new = 0;
    $(".comment-meta").each ( function(i,e) {
	let zdate = e.getAttribute("zdate");
	let old = zdate < time;
	if (!old) {
	    n_new += 1;
	}
	// I am doing string manip instead of what's probaby the better way of
	// adding/removing classes using jQuery tricks like Pycea does.
	let date_node = e.childNodes[1];
	if (!date_node) return;
	
	let dd = new Date(zdate); // TODO: see if this is a useless string object
	// TODO: my old-v-new logic is duped, need to consolidate
	let new_date_s = flagged_date_string(dd, old ? "" : "~new~");
	if (new_date_s != date_node.textContent) {
	    c += 1;
	    date_node.textContent = new_date_s;
	}
    });
    console.log("done, changed text on " + c);
    console.timeEnd("marknew");

    console.time("refresh");
    // should these be in the refresh thing, or here?
    $( "#applyTime ").prop( "disabled", false).text("APPLY");
    $( "#newTime ").prop( "disabled", false);

    // this seems to help chrome refresh its UI faster. Maybe?
    setTimeout( function() {
	console.log("refresh?");
	console.timeEnd("refresh");
    }, 1 );
    
}

function flagged_date_string(dd, flag) {
    return dd.toDateString() + " " + dd.toLocaleTimeString() + (flag ? (" " + flag) : "");
}


function LoadPostData() {
    // unused, for now
        var eatMetaData = function(data, status, xh) {
	console.log("got html response");
	if (debug) {
	    console.log(data);
	}

	// {"id":40213067,"publication_id":89120,"type":"newsletter","title":"Apply For An ACX Grant","social_title":null,"section_id":null,"search_engine_title":null,"search_engine_description":null,"subtitle":"...","slug":"apply-for-an-acx-grant","post_date":"2021-11-12T01:48:47.820Z","podcast_url":"","podcast_duration":null,"audience":"everyone","write_comment_permissions":"everyone","show_guest_bios":false,"default_comment_sort":null,"canonical_url":"https://astralcodexten.substack.com/p/apply-for-an-acx-grant","latest_comment_id":3857236,"comment_count"

	var post_id = parseInt(data.substr(6,20)); /* does this need to be a var? */
	console.log("got a post_id of " + post_id);
	let title_s = '"title":"'
	let k_0 = data.indexOf(title_s) + title_s.length;
	let k_1 = data.indexOf('"', k_0);
	var post_title = data.substring(k_0, k_1); /* same */
	
	localStorage.setItem(hpt + "-id", post_id);
	localStorage.setItem(hpt + "-title", post_title);
	

	
	location.reload();
	// TODO: try just going to eat_page instead.
	//setTimeout( eat_page, 1 );
    }
    
    
}

function LoadCurrentPageSettings(p) {
}

function ccc() {
    p.total_replaced = document.URL.startsWith("chrome-extension://") ||
	document.URL.startsWith("moz-extension://");
    p.this_url = document.URL;
    if (p.total_replaced) {
	this_url = window.location.search.split("=")[1];
    }
    
    const my_domain = this_url.split("/")[2];
    var post_slug = this_url.split("/")[4];
    var hpt = btoa(post_slug);
    var post_id = localStorage.getItem(hpt+"-id");
    var post_title = localStorage.getItem(hpt+"-title");
    var my_user_id = localStorage.getItem("my_user_id");
    var lastread = localStorage.getItem("lastread-" + post_id) || "2021-01-03T00:00:00.000Z";
    
    
    if (debug) {
	console.log("*** DEBUG 1");
	console.log(post_id);
	console.log(post_title);
	console.log(my_user_id);
	console.log("*** DEBUG 2");
    }
    
}
