
var total_replace = document.URL.startsWith("chrome-extension://") ||
    document.URL.startsWith("moz-extension://");
    
var is_firefox = 2;
console.log( typeof(browser) );
if (typeof(browser) == "undefined") {
    is_firefox = true;
} else {
    is_firefox = false;
}
// TODO: use is_firefox because we don't need to kill so many things below



var try_listener = false;
if (try_listener) {
    // I think this was all a stupid thing to try.
    
    document.listener = []
    
    var f = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, fn, capture) {
	document.listener.push(fn);
	this.f = f;
	
	this.f(type, fn, capture);
	console.log('Added Event Listener: on' + type);
	console.log(fn);
	console.log(this);
    }
}


// changeable in popup
var reload_comments = true;
var have_scores = false;
var sort = "new";
var debug = 1; // 0, 1, 2
//var lastread = "2021-01-02T00:00:00.000Z"; 

var normal_icon = chrome.runtime.getURL("icons/acx-standard-96.png");
var modded_icon = chrome.runtime.getURL("icons/acx-standard-mod-96.png");


// internal only
var change_icon = false;

var reload_speed = 15 * 1000;

// if we want to change the icon, we need to let a little bit of the
// original page load in, which means letting some of its scripts run


var settings_loaded = false;

console.log(localStorage);

console.log(document.URL);
var this_url = document.URL;
if (total_replace) {
    this_url = window.location.search.split("=")[1];
}

if (debug > 0) {
    console.log("this_url is now " + this_url);
    console.log(this_url.split("/"));
}
var my_domain = this_url.split("/")[2];
const domain = my_domain.split(".")[0]

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
if (post_id == null || post_title == null || my_user_id == null || my_user_id == "NaN") {
    console.log("NEED TO RELOAD");
    setTimeout( check_jQuery, 0 );
} else {
    setTimeout(eat_page, 1);
}



chrome.storage.local.get(
    [ "debug", "likes", "reload", "sort", "lastread" ], function(x) {

	debug = x.debug;
	console.log("debug is now " + debug);

	have_scores = (x.likes == 1);
	console.log("have_scores is now " + have_scores);
	
	reload_comments = !(x.reload == 0); // default true
	console.log("reload_comments is now " + reload_comments);

	sort = (x.sort ? x.sort : "new");
	console.log("sort is now " + sort);

	settings_loaded = true;
	console.log("settings are loaded!");
    });



function flagged_date_string(dd, flag) {
    return dd.toDateString() + " " + dd.toLocaleTimeString() + (flag ? (" " + flag) : "");
}

function mark_as_new(time) {
    console.time("marknew");

    var c = 0;
    var n_new = 0;
    $(".comment-meta").each ( function(i,e) {
	zdate = e.getAttribute("zdate");
	old = zdate < time;
	if (!old) {
	    n_new += 1;
	}
	// I am doing string manip instead of what's probaby the better way of
	// adding/removing classes using jQuery tricks like Pycea does.
	var date_node = e.childNodes[1];
	if (!date_node) return;
	
	var dd = new Date(zdate); // TODO: see if this is a useless string object
	// TODO: my old-v-new logic is duped, need to consolidate
	var new_date_s = flagged_date_string(dd, old ? "" : "~new~");
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

function settingsChanged(things) {
    console.log("things is " + things);
    console.log(things);
    let c;
/*
    if (c = things.lastread) {
	if (c.oldValue != c.newValue) {
	    console.log("UPDATE NEW!~");
	    mark_as_new(c.newValue);
	}
	}*/
    
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
chrome.storage.onChanged.addListener(settingsChanged);



if (debug) {
    console.log("intercept normal UI here");
}

if (change_icon == false) {
    window.stop();
    // firefox still loads some of the original page in the background??
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


window.fred = 0;
function eat_page() {
    // This is more complex than it has to be. But it works.
    // TODO: Figure out how to simplify but let it still work.
    window.fred += 1;
    console.log("eat page?  " + window.fred);
    if (window.fred > 20) {
	setTimeout( phase_two, 1);
	return;
    }
    console.log("document.head is " + document.head);
    if (document.head != null) {
	console.log("stopping all further loading");
	window.stop(); // we have what we need
    }
    
    // can I inject code into the head to catch any stray functions?
    console.log("jQuery is " + jQuery);
    if (jQuery) {
	console.log("html is " + $("#html") );
	console.log( $("#html") );

    	console.log("document is" + $("document") );
   	console.log( $("document") );
}
    console.log("document body is " + document.body);
    if (document.body == null) {
//	console.log("debug is " + debug);
	console.log("not loaded yet");
	setTimeout(eat_page, change_icon ? 0: 0);
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


function change(dot = false) {
    if (change_icon == false) return;
    // check e575618bed9c68139cb92a2b6e69f0db3f0ac7b3 for old debug code
    var link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';

    link.href = dot ? modded_icon : normal_icon;
    if (debug) {
	console.log("setting to dot = " + dot);
	console.log("href is " + link.href);
    }
    document.getElementsByTagName('head')[0].appendChild(link);
}

function new_comments2(data) {
    if (debug > 0) {
	console.log("New comment is " + data);
	console.log(data);
	console.log(JSON.stringify(data));
    }
    var zap = make_comment(data, "~new~");
    if (debug >= 0) {
	console.log("zap is " + zap);
	console.log(zap);
    }
    // why am I getting back an *object* and not the *comment* ?
    var comment_block = zap[0];
    console.log("comment_block is " + comment_block);
    console.log(comment_block);
    
    var apath = data.ancestor_path;
    var parent_array = apath.split(".");
    var parent_id = parent_array[ parent_array.length - 1 ];
    console.log("parent_id is " + parent_id);
    var parent_node = document.getElementById("comment-" + parent_id);
    if (apath == "") { 
	// no parent, must be top-level comment. 
	// this will break if you try to make the FRIST comment
	var root = document.getElementsByClassName("comment-list-container")[0];
	root.insertBefore(comment_block, root.childNodes[0]);
	return;
    }

    if (debug > 0) {
	console.log("parent_node is " + parent_node);
	console.log(parent_node);
    }
    // find the parent, then make a 4th node if it doesn't exist.
    var dad = parent_node.parentElement;
    var kids = dad.childNodes;
    if (debug > 0) {
	for (var i = 0; i < kids.length; i++) {
	    console.log("number " + i + ": element is");
	    console.log(kids[i]);
	    console.log(kids[i].tagName);
	    console.log(kids[i].className);
	    console.log("*");
	}
    }
    // is this the right order if I already have child comments?
    if (kids[3] && kids[3].tagName == "FORM") {
	kids[3].remove(); 
    }
    if (kids[3] == undefined) {
	//    var comment_list = jQuery( '<div/>', { class: "comment-list" });
	var comment_list = jQuery( '<div class="comment-list">' +
                                   '<div class="comment-list-collapser"></div>' +
                                   '<div class="comment-list-collapser hidden"></div>' +
                                   '<div class="comment-items">' +
                                   '<div class="hidden dummy"></div>' +
                                   '</div> ' +
				   '</div>' );
	// dummy so we can insert something before it                         
	
	// why is this [0]? What broke?
	dad.append(comment_list[0]);
    }
    if (debug > 0) {
	console.log("INSERT ONTO THIS:");
	console.log("kids[3] is " + kids[3]);
	console.log(kids[3]);
	console.log("kids[3].childNodes is " + kids[3].childNodes);
	console.log(kids[3].childNodes);
	console.log("kids[3].childNodes is " + kids[3].childNodes[2]);
	console.log(kids[3].childNodes[2]);
    }
    var putHere = kids[3].childNodes[2];
    // insert into front or back??
    putHere.insertBefore(comment_block, putHere.childNodes[0]);
    
    
}

function submit_comment2(x) {
    console.log("SUBMIT COMMENT");
    if (debug > 0) {
	console.log("trying to submit: " + x);
	console.log(x);
	document.abc = x; // so the console can play with it. (Does this work?)
	   
    }
    console.log("ha hah");
    x.disabled = true; // no double posts.
    var body = x.form.body.value;
    var token = null;
    var id = x.form.parent_id.value;
    var post_id = document.post_id;  // does this work?

    var url = 'https://' + domain + '.substack.com/api/v1/post/' + post_id + '/comment'

    // TODO: make sure jQuery has loaded 
    console.log("jquery is " + jQuery);
    var  data = { body: body,
                  token: token,
                  parent_id: id };
    if (debug > 0) {
	console.log("id is " + id);
	console.log("posting to " + url + " with " + data);
	console.log(data);
    }
    $.ajax({ type: "POST",
             url: url,
             data: data,
             datatype: "json",
             success: new_comments2
	     // TODO: warn user on failure
	   });
    
    return true;
}

function do_delete(id) {
    console.log("remove " + id + " from UI!");
    // 1.  we set the author and body to "deleted"
    // 2.  remove all reactions
    // 3.  optional: totally remove from UI if all children deleted
    var temp = document.getElementById("comment-" + id);
    var comment = temp.parentNode;
    console.log("comment is " + comment);
    console.log(comment);
    var content = comment.childNodes[2];
    console.log("content is " + content);
    console.log(content);
    var smurf = content.childNodes[0].childNodes[1];
    // 1a. delete author
    var meta = smurf.childNodes[0];
    meta.innerHTML = "<i>deleted</i>";
    // 1b. delete body
    var body = smurf.childNodes[1];
    body.innerHTML = "<i>deleted</i>";
    // 2. delete reactions
    var actions = smurf.childNodes[2];
    actions.remove();
    console.log("comment deleted");
    
}

function like(xid) {
    console.log("like " + xid);
    console.log(xid);
    xid.disabled = true;
    
    var nid = xid.target.name; // "comment-123"
    console.log("nid is " + nid);
    $("#" + nid).off( "click" );
    var id = nid.split("-")[1];
    var url = 'https://' + domain + '.substack.com/api/v1/comment/' + id + '/reaction';
    data = { reaction: "❤"};
    $.ajax({ type: "POST",
	     url: url,
	     async: true,
	     data: data
	     //success: function() { do_delete(id) }
	     // TODO: warn user on failure
	   });
}
	
function deleet(xid) {
    console.log("delete " + xid);
    if ( confirm("Do you wish to delete this comment?") ) {
	var nid = xid.target.name; // "comment-123"
	var id = nid.split("-")[1];
	var url = 'https://' + domain + '.substack.com/api/v1/comment/' + id;
	// TODO: replace "DELETE" button with "deleting"  
	$.ajax({ type: "DELETE",
		 url: url,
		 async: true, 
		 success: function() { do_delete(id) }
		 // TODO: warn user on failure
	       });
    }

}

function reply(xid) {
    // raw Jav<aScript, not jQuery
    if (debug > 0) {
	console.log("reply3ing to id " + xid);
	console.log(xid);
	console.log("target is " + xid.target);
	console.log(xid.target);
	console.log("target.name is " + xid.target.name);
	console.log(xid.target.name);
    }
    var nid = xid.target.name; // "comment-123"
    var id = nid.split("-")[1];
    var newform = document.getElementById("commentor").cloneNode(true);

    //newform.style.display = "block";
    newform.parent_id.value = id;
    var target = document.getElementById(nid);
    if (debug > 0) {
	console.log(target)
	console.log("===")
	console.log(jQuery);
	console.log(jQuery());
	console.log(jQuery().jquery);
	
    }
    //	newform.post.click = submit_comment2;
    if (debug > 0) {
	console.log("post button is " + newform.post);
	console.log(newform.post);
    }
    newform.post.addEventListener("click", function(){submit_comment2(newform.post); });
    newform.cancel.style.display = "block";
    newform.cancel.addEventListener("click", function() { newform.remove(); });
    // deleted
    var ins = target.parentElement.childNodes[2];
    if (debug > 0) {
	console.log("going to put at " + ins);
	console.log( ins );
    }
    $(newform).insertAfter( ins );
    
	
}

var global_latest = "";

var comment_table = { }

// hash takes <1ms
function hash_color(str) {
    if (!str) return 0xa0a0a0; // bland gray

    var hash = new Number(0);
    var l = str.length;
    for (var i = 0; i < l; i++) {
        var char = str.charCodeAt(i);
	hash = ((hash*32)-hash) + str.charCodeAt(i);
	hash = hash & 0x7FFFFFFF;
	
    }
    return hash % (256 * 256 * 256);
    
}

var null_name = [" "]

function make_comment(c, flag="") {
    // TODO: Is it faster to prebuild one root comment, and then copy it?
    //       Or build one dynamically from scratch each time?
    var id = c.id;
    var dd = new Date(c.date);
    // ugh, the instant reply I get back doesn't have a date.

    if (comment_table[id] == undefined) {
	// firefox distribution uses "c.date undefined"? 
	//&& c.date != null && c.date != undefined)  <-- for dynamic loading
	comment_table[id] = dd;
	// console.log("new comment");
    } else {
	// already populated!
	// console.log("existing comment 1");
	return null; // this isn't right; we still need to iterate on the kids 
    }
    
    if (c.date > global_latest) {
	if (reload_comments && debug) {
	    console.log("NEW LATEST POST! " + id);
	}
	global_latest = c.date;
	if (debug > 0) {
	    console.log(global_latest);
	}
    } 
    if (debug > 1) {
	console.log("in original make_comment " + id);
	console.log("comment is " + c);
	console.log(c);
    }

    // This is the object that gets returned.
    var comment = jQuery('<div/>', { class: "comment" } )

    var div1 = jQuery('<div/>', { id: "comment-" + id } )
    var div2 = jQuery('<div/>', { id: "comment-" + id + "-reply" } )
    var ctable = jQuery("<table/>", { class: "comment-content" })
    
    // user pic, td1
    var avatar = c.photo_url;
    var img;
    var never_load_avatars = false;
    // on a fast reference machine, loading ~100 root comments with ~275 comments:
    //      * takes 800ms to render without avatars
    //      * takes 900ms to render with avatars
    // always do the dummy avatar, for faster loading
    if (never_load_avatars || c.photo_url == null) {
	try {
	    var names = c.name ? c.name.split(" ") : null_name;
	    letter = names.length > 1 ? names[0][0] + names[1][0] : names[0][0]
	} catch (err) {
	    console.log(err.message);
	    letter = "?";
	}
	var fakeimgclass = `fakeimg${letter.length}`
	var color = hash_color(c.name);
	var r = (color / 256 / 256);
	var g = (color / 256) % 256;
	var b = color % 256;
	var hsp = Math.sqrt(.3 * r * r + .59 * g * g + .114 * b * b);
/*	var make_white =
	    ((color / 256 / 256) * .21 + // red
	     (color / 256 % 256) * .71 + // green
	     (color % 256) * .07 // blue
	    ) < 42 ? "" : "color: white;";
	console.log("hsp is " + hsp + " and brightness is " +
		    (	    ((color / 256 / 256) * .21 + // red
			     (color / 256 % 256) * .71 + // green
			     (color % 256) * .07 // blue
			    ))); */
	make_white = (hsp > 126) ? "" : "color: white;";
	if (debug) {
	    console.log(letter + ": " + c.name + " is " + color + " and " + make_white);
	}
	img = jQuery('<span/>', { class: fakeimgclass,
				  style: make_white + "background-color: #" + color.toString(16).padStart(6,0)}).
	    text( letter );
    } else {
	img = jQuery('<img/>', { src: c.photo_url } );
    }
//    console.log("c.photo_url is " + c.photo_url);
    var imgwrap = jQuery('<td/>', { class: "profile-img-wrap" } ).
	append( img );
    var td1 = jQuery('<td/>', { class: "comment-head" }).
	append( jQuery('<div/>', { class: "user-head" }).
		append ( jQuery('<a/>' ).
			 append( imgwrap )));
    // comment, td2


    var td2;
    if (c.deleted) {
	// TODO: make this neater
	// TODO: hide if all children deleted
	td2 = jQuery ('<td/>').
	    text("deleted");
    } else {
	var score = Math.floor( c.score * 10000 ) / 100.0;
	var display_name = have_scores ? `${c.name} : ${score}` : c.name;
	var tag = (flag == "dynamic") ?
	    ( c.date < lastread ? "" : "~new~" ) :
	    flag;
	var date_s = flagged_date_string(dd, tag);
	// TODO: any difference between making this an attribute vs a JS-element property?
	var meta = jQuery('<div/>', { class: "comment-meta", zdate: c.date }).
	    append( jQuery('<span/>', { style: "font-weight: bold;" } ).
		    text( display_name )).
	    append( jQuery('<span/>', { style: "font-family: Georgia; color: #888;" } ).
		    text( date_s ));
	if (flag && false) {
	    meta.append( jQuery('<span/>').
			 text (flag) );
	}
	var cbody = jQuery('<div/>', { class: "comment-body"} ).
	    append( jQuery('<p/>').
		    text(c.body) );
	var actions = jQuery('<div/>', { class: "comment-actions"} );

	if (have_scores) {
	    var count = c.reactions["❤"];
	    var count_text = count > 0 ? `${count} ♥` : "♥";
	    var anchor_like = jQuery( '<a/>', { name: "like-" + id,
						id: "like-" + id }).
		text( count_text ).
		appendTo( actions );
	    if (c.reaction != "❤") { // can't like a second time
		anchor_like.click( like );
	    }

	}
	
	jQuery( "<b>&nbsp;</b>" ).
	    appendTo( actions );

	var anchor_reply = jQuery( '<a/>', { name: "comment-" + id }).
	    text( "REPLY" ).
	    click( reply ).
	    appendTo( actions );
	
	jQuery( "<b>&nbsp;</b>" ).
	    appendTo( actions );

	
	
	// Only show DELETE on your own comments ;)
	if (c.user_id == my_user_id) {
	    var anchor_delete = jQuery( '<a/>', { name: "delete-" + id }).
		text( "DELETE" ).
		click( deleet ).
		appendTo( actions );
	}
	td2 = jQuery('<td/>').
	    append(meta).
	    append(cbody).
	    append(actions);
    }
    
    var row = jQuery('<tr/>' ).
	append(td1).
	append(td2);
    
    ctable.append(row);
    
    comment.append(div1).append(div2).append(ctable);
    
    if (c.children.length > 0) {
	var cl = make_comment_list_from_array(c.children);
	comment.append( cl );
    }
    
    return comment;
}

function make_comment_list_from_array(cs) {
    var comment_list = jQuery( '<div/>', { class: "comment-list" } )
    comment_list.append( jQuery( '<div/>', { class: "comment-list-collapser" } ).
			 append( jQuery('<div/>',
					{ class: "comment-list-collapser-line"} )) )
    comment_list.append( jQuery( '<div/>', { class: "comment-list-collapser hidden" } ))
    
    var comment_list_items = jQuery( '<div/>', { class: "comment-list-items" } )

    comment_order(cs).forEach( function(c) {
	comment_list_items.append( make_comment(c, "dynamic") );
    } )
    
    comment_list.append( comment_list_items );
    
    return comment_list;
}


function check_jQuery() {
    var a = typeof jQuery;
    if (debug > 0) {
	console.log("a is " + a);
    }
    if (a == "undefined") {
	setTimeout( check_jQuery, 1);
    } else {
	setTimeout( retrieve_meta_data, 1);
    }
}

function retrieve_meta_data() {
    
    console.log("could not find post_id");
    // Yo dawg, load the same page we are on
    // (Is there a better way to do this? Can I read the HTML somehow?)
    
    
    var url = this_url;
    url = url.replace(/simple$/, '');
//    url = url.replace(/simple$/, 'comments'); // this line does nothing?
    
    
    if (debug) {
	console.log(url);
	console.log("wiping out document...?");
    }

    var body = document.createElement('body');
    document.body = body;
    
    var eatHtml = function(data, status, xh) {
	console.log("got html response");
	if (debug) {
	    console.log(data);
	}
	// very crude JSON parsing, but fast. TODO: have a backup
	var i = data.indexOf('"post":');
	var id_s = '"id":';
	var j = data.indexOf(id_s, i) + id_s.length;
	var post_id = parseInt(data.substr(j,20));
	console.log("got a post_id of " + post_id);
	var title_s = "<title data-preact-helmet>";
	var k = data.indexOf(title_s) + title_s.length;
	var post_title = data.substr(k, 15);

	localStorage.setItem(hpt + "-id", post_id);
	localStorage.setItem(hpt + "-title", post_title);
	
	if (my_user_id == null) {
	    var user_s = '<input type="hidden" name="user_id" value="'
	    var u = data.indexOf(user_s) + user_s.length;
	    var my_user_id = parseInt(data.substr(u, 20));
	    localStorage.setItem("my_user_id", my_user_id);
	}

	
	location.reload();
	// TODO: try just going to eat_page instead.
	//setTimeout( eat_page, 1 );
    }

    console.log("launching AJAX!!!22");
    console.log("abc");
    console.log("jquery is " + typeof jQuery);
    $.ajax({
	url: url,
	success: eatHtml,
	dataType: "html"
    });
    
}//
//else {
//    console.log("post_title is " + post_title);
//    console.log("post_id is " + post_id);
//}

function init_page() {
    console.log("READY TO INIT");
    //var x = $( '#test_new_comment' );
    var x = document.getElementById( 'test_new_comment' );
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

// I don't think hte order matters here. This just finds unused comments.
function scan_c(c) {
    var id = c.id; // compare to start of make_comment()
    if (comment_table[id] == undefined) {
	//changeFavicon('http://www.google.com/favicon.ico');
	console.log("NEW DYNAMIC COMMENT");
	console.log("I want to paste this comment: " + c);
	console.log(c);
//	var dd = new Date(c.date);
//	comment_table[id] = dd;  <-- this happens in new_comments2();
	new_comments2(c); // POPULATE THE NEW COMMENT!
    }
    if (c.date > global_latest) {
	console.log("NEW LATEST POST2! " + id);
//	console.log(dd);
	global_latest = c.date;
//	console.log(global_latest);
    } 
    c.children.forEach (scan_c); // recurse
}

// "scan" just means to iterate through themn
function scan_comments(data) {
    var comments = data["comments"];
    if (comments !== undefined) {
	console.log("resetted global_latest");
	global_latest = ""; // reset
	comments.forEach ( scan_c );
    }
}
	
// can I use a closure to avoid this thunk?
function dump_it_now(data, status, xh) {
    dump_it(data, status, xh, true);
}
function dump_it(data, status, xh, now = false) {
    if (data.comments !== undefined) {
	console.log("data length is " + data.length);
	console.log(xh.getResponseHeader("date"));
	console.log("==");
	console.log(xh); 
	console.log("DUMP IT " + JSON.stringify(data));
	scan_comments(data);
	if (change_icon) {
	    change(true);
	    // we never change it back :/
	}
    } else {
	console.log("nuthin'");
    }
    if (!now) {
	setTimeout( spin_comments, 1 );
    }
}

function load_comments(now = false) {
    if (!reload_comments && !now) {
	return;
    }
    post_id = document.post_id; 
    url = "https://" + domain + ".substack.com/api/v1/post/" +
	post_id +
	"/comments?token=&all_comments=true&" +
	"sort=most_recent_first&last_comment_at=" + global_latest;
    $.ajax({
	url: url,
	success: now ? dump_it_now : dump_it,
	failure: function() {
	    if (!now) {
		console.log("We failed to load comments. Trying again in a minute,");
		setTimeout( spin_comments, 60 * 1000);
	    } else {
		console.log("We failed to load comments now.");
	    }
	},
	dataType: "json"
    })
}
function spin_comments() {
    if (reload_comments) {
	setTimeout( load_comments, reload_speed );
    }
}





function phase_two() {

    console.log("setting_loaded is " + settings_loaded);
    if (!settings_loaded) {
	setInterval( phase_two, 2);
    }

    if (change_icon) {
	window.stop(); // do it now, since we didn't before
	
	var count = window.setTimeout( null, 0);
	for (var i = 0; i < count + 10; i++) {
	    window.clearTimeout(i);
	}
	console.log("killed timeouts");	
	count = window.setInterval( null, 0);
	for (var i = 0; i < count + 10; i++) {
	    window.clearInterval(i);
	}
	console.log("killed intervals");	

    }
    
//    if (post_id != null) {

    console.log("post_title is " + post_title);
    console.log("post_id is " + post_id);

    document.post_id = post_id;

    // TODO: put into its own file
    // the link here seems unused?
    // the link here works on firefox, not on chrome!
// <link rel="shortcut icon" type="image/jpg" href="https://stackoverflow.com/favicon.ico" />
    // wait, nothing works in chrome!
    // link renoved


    // this is duped in simple2.html
    
    newHTML = `<html>
  <head>
    <title id=title1>Simple ACX: ` + escapeHTML(post_title) + `</title>
<!--  access these if they are neither part of manifest.json nor part of the web-accessible-resources? -->
   <link rel="stylesheet" href="style.css">
  <link rel="stylesheet" href="main.css">
  <link rel="stylesheet" href="clean.css"> 

<style>.comment-body p {
white-space: pre;
white-space: pre-line;
} </style>
  </head>
  <body>


<div style="background-color:white; width:100%"><span id=status style="text-align:left;">status goes here</span>
<div style="z-index:10; background-color: #f0f0f0; position: fixed;top: 1em;right: 1em;">
  <div>
    Highlight as 'new' posts made after:
  </div>
    <table>
     <tr>
      <td>
       <input style="font-family: Courier New; font-size: x-large;" type=text id="newTime" width=80% />
      </td>
     <td>
      <span width=20% >
       <button style="width:60px;" id=applyTime>APPLY</button>
       <br>
       <button style="width:60px;" id=cancelTime>CANCEL</button>
     </span>
    </td>
   </tr>
  </table>
  <div>
    <button style="font-size: smaller; width=50%" id=now>Set to now</button>
    <button style="font-size: smaller; width=50%" id=latest>Set to latest comment on page</button>
  </div>
</div>
<span style="float:right; display:none;">New Comments:<button style="display:none;" name="checknow">Check Now</button></span></div>
<div style="display:none;">
<form id=commentor method="post" class="form comment-input" novalidate="">
<input type=hidden value=123 name=parent_id />

<div class="comment-input-head"><div class="user-head "><a href=""><div class="profile-img-wrap">
<div>→</div>
</div></a></div></div><textarea style="resize:both; height:100px; width:50%;" name="body" placeholder="Write a comment…" value="" style="height: 37px;"></textarea><div id="error-container"></div>
<button tabindex="0" class="button primary " type="button" name="post"">Post</button>
<button tabindex="0" class="button " style="display:none;" type="button" name="cancel"">Cancel</button>
</form>
</div>
<p id=newrootcomment />



   <div class="comments-page" id=comments><b>comments:</b>
    <div class="container">
      <div class="comment-list-container">
       <div class="comment-list">
        <div class="comment-list-items" id="comment-list-items">
     
        </div> <!-- .comment-list-items -->
       </div> <!-- .comment-list -->
      </div> <!-- .comment-list-container -->
    </div> <!-- .container --> 
   </div> <!-- .comments-page -->
   <div id=hidden>Loading comments, this will go faster in the future, I promise...</div>

  <div id=test_new_comment />
  <div id=last style="display:none;" />
  </body>
</html>`

    /*
      COMMENT-LIST-CONTAINER contains
      1: div comment-list

      EACH COMMENT-LIST contains (horizontally) 
         ** EITHER ** 
      1: div comment-list-collapser          (line to click)
      2: div comment-list-collapser hidden   (UNKNOWN) <-- sometimes not there
      ?: OPTIONAL: button collapsed-reply "X new replies"
      3. div comment-list-items              (all the comments)
         ** OR ** 
      1. button collapsed-reply, which expands to the others

      EACH COMMENT-LIST-ITEMS (vertically)
      *. div comment                         (1 or more -- right?)

      EACH COMMENT contains
      1: div   comment-123        (anchor)
      2: div   comment-123-reply  (anchor)
      3: table comment-content
      ? sometimes, a FORM element. What order?
      4: div   comment-list      IFF there are children

	
      EACH COMMENT-CONTENT contains a TR 
         ... which in turen contains
      1. td comment-head (picture)
      2. td smurf   (the comment) (smurf is my name)
      
      EACH SMURF contains (vertically)
      1. div comment-meta      (author and timestamp)
      2. div comment-body      (actual contents of comment)
      3. div comment-actions   (reply, parent, ❤)
      
      PLEASE TAKE NOTES, THERE WILL BE A SHORT QUIZ
      
       */

    if (debug > 0) {
	console.log("466: document.body should be null, is " + document.body);
    }
    {

	// this is old crap that isn't needed, right??
	
	var head = document.createElement('head');
	head.innerHTML = "<meta>stuff</meta>";
	document.head = head;
	//document.head.innerHTML = "<meta>stuff</meta>";
	// I should put the proper head elements into the head
    }
    change();
    var body = document.createElement('body');
    document.body = body;

    
    
    document.body.innerHTML = newHTML;

    // is this the proper scope?


    
    
    // obj data, string status, jqXHR xh
    function eatJson(data, status, xh) {
	console.log("we have the reply");


	console.timeEnd('requestComments');
	console.time('parseJSON');
	resdata = data;
	if (debug || true) {
	    console.log("data is " + typeof data);
	    console.log(data);
	    $("#hidden").hide().text(JSON.stringify(data));
	    // In console, type:
	    //    var b = JSON.parse($("#hidden").innerHTML)
	    // to play with this.
	    console.log("status is " + status);
	    console.log("jqXHR is " + xh);
	    console.log(xh);
	}
	var comments = data["comments"];
	
	var string = "there are " + comments.length + " top comments";
	console.timeEnd('parseJSON');	
	console.log(string);
	$( "#status" ).text(string);

	var cs = data.comments;
	// Um, why do I set both comments=data["comments"] and cs=data.comments ??

	console.time('createElements');
	// returns a function that appends to the comment
	var append_comment_factory = function(parent_comment) {
	    return function(c) {


		var ctable = make_comment(c, "dynamic");

		if (debug) {
		    console.log("length of children is " + c.children.length);
		}
		ctable.appendTo(parent_comment);
	    }
	}

	// how to do this right:
	// 1. for each comment-array, make a COMMENT-LIST object
	//     (verify that for one-comment arrays)
	// 2. append that comment-list into (a) parent COMMENT
	//     or (b) COMMENT-LIST-CONTAINER (for first array)
	
	
	comment_order(cs).forEach( append_comment_factory( $("#comment-list-items") ) );


	console.timeEnd('createElements');
	console.log("all comments populated");

	if (reload_comments) {
	    spin_comments();
	    if (debug) {
		console.log(comment_table);
	    }
	}
    }
    
    
    console.log("trying to load comments now...");
    
    // TODO: make this call *first*, since we will end up waiting for it
    
    //	https://astralcodexten.substack.com/api/v1/post/32922208/comments?token=&all_comments=true&sort=most_recent_first&last_comment_at=2021-02-27T02:53:17.654Z

    function method_one(string) {
	var output = true;
	console.log("method one");
	var limit = 30;
	var suffix = "";
	
	var suffixes = [ '',
			 '":0}]}',
			 '":0}]}]}',
			 '":0}]}]}]}',
			 '":0}]}]}]}]}',
			 '":0}]}]}]}]}]}]}]}]}]}]}]}',
			 '"}]}',
			 '"}]}]}',
			 '"}]}]}]}',
			 '"}]}]}]}]}]}]}',
			 '"}]}]}]}]}]}]}]}',
			 '"}]}]}]}]}]}]}]}]}]}]}',
			 '"}]}]}]}]}]}]}]}]}]}]}]}]}]}',
		       ];
	
	while (limit > 0) {
	    limit -= 1;
	    console.log("abc");
	    l = string.length;;
	    if (output) {
		    console.log("limit is " + limit + 
				" string is [" + l + "] " + string.substring(0,30) + "..." +
				(string+suffix).substring(l-100));
		}
		try {
		    // TODO: ]} will always be missing at the end
		    //console.time("bustJSON");
		    var broken = JSON.parse(string + suffix);
		    //		console.log("it worked!");
		    //		console.log(broken);
		    console.log("it worked, comments.length is " + broken.comments.length);
		    if (! suffixes.includes( suffix )) {
			console.log("NEW SUFFIX!");
			console.log("suffix is >> " + suffix + " <<");
		    }
		    // we should assume the final comment is incomplete
	    
		    limit = 0;
		} catch (err) {
		    console.log("ERR: " + err.message);
		    var err = err.message.substr(12);
		    
		    if (err.startsWith( "unterminated string" )) {
			suffix += '"';
		    } else if (err.startsWith( "end of data after property value" )) {
			suffix += "}";
		    } else if (err.startsWith( "end of data when '," )) {
			suffix += "]";
		    } else if (err.startsWith( "expected ':' after ") ||
			       err.startsWith( "end of data after property name when ':'")) {
			suffix += ":0}";
		    } else if (err.startsWith( "end of data when property name was expected")) {
			suffix += '"X":0}';
		    } else if (err.startsWith( "unexpected end of data at ")) {
			suffix += "0}";
		    } else {
			console.log("UNCAUGHT: [" + err + "]");
			output = true;
		    }
		} finally {
		    //		console.timeEnd("bustJSON");
		}
	    } // limit
    }
    
    function method_two(string) {
	
	var works = null;
	var term = [
	    '',       // 
	    '":0}',   // in key
	    ':0',     // after key
	    ':0}',     // after colon, in object??
	    '0}',     // before colon, in object
	    '"}',     // in string value
	    '}',      // in number value
	    '"":0}', // after , in object
	    '"]',     // in quote in array
	    '"',      // in string as part of array?
	    //	    '":0}',   // ????
//	    '":0}}',   // in key of object of object? :( :(
//	    '}}'       // double-object? I might need a } to toggle through
	    ':0}}' // ugh, triple nested object??
	]

	

	// is there possibly a partial "null" in the last 4 characters?
	if (string.indexOf("n", string.length-4) > -1) {
	    term.push("ull}");
	    term.push("ll}");
	    term.push("l}"); 
	}
	if (string.indexOf("t", string.length-4) > -1) {
	    term.push("rue}");
	    term.push("ue}");
	    term.push("e}"); 
	}
	if (string.indexOf("f", string.length-5) > -1) {
	    term.push("alse}");
	    term.push("lse}");
	    term.push("se}");
	    term.push("e}");
	}

	// closing \ is too insane to contemplate. 
	// get rid of it
	while (string.endsWith('\\')) {
	    string = string.slice(0, -1);
	}
	
//	console.log("term is " + term);
//	console.log(term);
	var suffix = "";
	outer: {
	    for (var limit = 0; limit < 30; limit++) {
		//console.log("limit is " + limit);
		var suff = "]}".repeat(limit);
		for (var t of term) {
		    try {
			works = JSON.parse(string + t + suff);
			suffix = t + suff;
			break outer;
			console.log("it worked!");
		    } catch (err) {
			// nop
		    }
		    try {
			works = JSON.parse(string + t + '}' + suff);
			suffix = t + '}' + suff;
			break outer;
			console.log("it worked!");
		    } catch (err) {
			// nop
		    }
		} // term
	    } // limit
	} // outer
	console.log("suffix is " + suffix);

	if (! works) {
	    console.log(string);
	    console.log("METHOD ONE!!!");
	    method_one(string);
	}
	return works;
    }

    function do_all(string) {
	var l = string.length;
	console.log(" *** DOING ALL *** ");
	for (var i = 1400; i < l; i += 1000) {
	    var blob = method_two( string.substr(0, i) );
	    console.log("for " + i + ", comment count is " + blob.comments.length);
	}
	// nothing
    }

   

    function parsePartial(string) {
	var l = string.length;
	if (string.length < 40) {
	    // console.log("string is [" + l + "] " + string);
	    return;
	}

	if (string.substring(l-3) == "}]}") {
	    //do_all(string);
	}
	
	console.log("string is [" + l + "] " + string.substring(0,30) + "..." +
		    string.substring(l-30));
	if (false) {
	    try {
		console.log("plain parse");
		var broken = JSON.parse(string);
		console.log("plain parse worked!");
		console.log(broken);
	    } catch (err) {
		console.log("JSON parse failed " + err.message);
		//console.log(err);
	    }
	}

	
	console.time("JSONrecover");
	var output = false;

	var method = 0; // 1 is dynamic, 2 is brute-force
	if (method == 1) {
	    
	    var works = method_one(string);
	} else if (method == 2) {

	    var works = method_two(string);

	}
	console.log("method was " + method);
	console.timeEnd("JSONrecover");
	
    }
    
    var site = domain + ".substack.com";
    var args = "token=&all_comments=dummy&sort=most_recent_first&last_comment_at=2021-02-27T02:53:17.654Z";
    var url = "https://" + site + "/api/v1/post/" + post_id + "/comments?" + args;

    console.log("why do I have that wrong hard-coded string in there?");
    
    if (debug) {
	console.log("making ajax");
    }

    var xhr = $.ajaxSettings.xhr();
    // google chrome? 
    xhr.onreadystatechange = function(abc) {
	if (debug > 0) {
	    console.log("READY STATE CHANGE");
	}
	// TODO: recognize what states aren't going to give us useful information
	//       and short-circuit if our response is complete


	//	console.log("abc is " + abc);
//	console.log(abc);
	
	//console.log("srcElement (src) resp is " +      abc.srcElement.response.length);
	//console.log("srcElement (src) resp text is " + abc.srcElement.responseText.length);
	//console.log("srcElement (trg) resp is " +      abc.target.    response.length);
	//console.log("srcElement (trg) resp text is " + abc.target.    responseText.length);

	// TODO: only parse one partial response at a time
	parsePartial(abc.srcElement.responseText);
	
    }
    xhr.upload.addEventListener("onreadystatechange", function( event ) {
	console.log("EVENT!!");
    }, false);
    function newXhr() { 
	return xhr;
    }
    
    console.time('requestComments');
    $.ajax({
	url: url,
	success: eatJson,
	dataType: "json"
// 	xhr: newXhr
    })
    console.log("did request, waiting for reply");
    // is this inefficient by making a reply function that will get cloned
    // and overwritten on each "reply" ?
    // TODO: have a base "commentor" that everything, including this, gets cloned from
    // copy the hidden form and post it, then edit it
    var new_root = document.getElementById("commentor").cloneNode(true);
    //    new_root.style.display = "block";
    new_root.id="root_comment";
    document.getElementById("newrootcomment").append( new_root );
    console.log("************* NEW ROOT");
    var root_reply = new_root.post;
    root_reply.addEventListener("click", function(){
	submit_comment2(root_reply);
    });


    $( "#newTime" ).val( i2f(lastread) ).
	prop( "goodvalue", i2f(lastread) );
    
    // TODO: remove common code below
    $( "#now" ).click ( function() {
	$( "#newTime" ).val( get_24hour_local_datetime() ).
	    removeClass( "badtime" ).
	    addClass( "modtime" );
    });
    $( "#latest" ).click( function() {
	$( "#newTime" ).val( i2f(global_latest) ).
	    removeClass( "badtime" ).
	    addClass( "modtime" );
    });
	
    console.log("added click");
    
    function setTime() {
//	console.log("date is changed, now " + newTime.value);
	$( "#applyTime" ).prop("disabled", true).text( "busy…" );
	// TODO: verify valid here
	try {
	    var official_time = f2i( $("#newTime").val() );

	    if (debug) {
		console.log("official time is " + official_time);
		console.log("i2f of that is " + i2f(official_time));
	    }
	    localStorage.setItem("lastread-" + post_id, official_time);
	    $( "#newTime" ).prop("disabled", true).
		removeClass( "modtime" ).
		val( i2f(official_time) ).
		prop( "goodvalue", i2f(official_time) );
	    
	    // small gap to let Chrome/Brave UI thread catch up.
	    // TODO: still needed?
	    setTimeout ( function() { mark_as_new(official_time) }, 1 );
	} catch (err) {
	    // this should really never happen
	    alert("oops");
	}

    }

    function revertTime() {
	$( "#newTime" ).val ( $( "#newTime" ).prop( "goodvalue" ));
	$( "#newTime" ).removeClass ( "badtime modtime ");
    }
    
    function verifyTime() {
	newTime = document.getElementById("newTime");
	applytime = document.getElementById("applyTime");
	try {
	    // This is actually cleaner with plain JavaScript than jQuery??
	    f2i( newTime.value);
	    $( "#newTime" ).removeClass( "badtime" );
//	    newTime.style.backgroundColor = "white";
	    applytime.disabled = false;
	} catch (err) {
	    if (err.message != "Invalid time value" && err.message != "invalid date") {
		console.log(err.message);
	    }
	    $( "#newTime" ).addClass( "badtime" );
	    applytime.disabled = true;
	} finally {
	    console.log("adding modtime?");
	    // this may be too broad
	    if (newTime.value != newTime.goodvalue) {
		$( "#newTime" ).addClass( "modtime" );
	    } else {
		$( "#newTime" ).removeClass( "modtime" );
	    }
	}
    }
    
    // I can use jQuery here, again
    $( "#newTime" ).keydown( verifyTime).
	keyup( verifyTime).
	change( verifyTime).
	bind( "paste",  verifyTime);
    $( "#applyTime" ).click( setTime );
    $( "#cancelTime" ).click( revertTime ); 
    
    window.addEventListener('focus', function() { change() } );    
    
}


