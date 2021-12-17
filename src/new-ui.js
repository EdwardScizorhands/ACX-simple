

// SETTINGS FROM POP-UP
var reload_comments = true;
var have_scores = false;
var sort = "new";
var debug = 0; // 0, 1, 2. 


// DEVELOPMENT SETTINGS
var change_icon = false;
var reload_speed = 15 * 1000;


// if we want to change the icon, we need to let a little bit of the
// original page load in, which means letting some of its scripts run.
// (Or else do a total-replace).
var normal_icon = chrome.runtime.getURL("icons/acx-standard-96.png");
var modded_icon = chrome.runtime.getURL("icons/acx-standard-mod-96.png");


var settings_loaded = false;


// SET GLOBALS
{
    var total_replaced = document.URL.startsWith("chrome-extension://") ||
	document.URL.startsWith("moz-extension://");
    var this_url = document.URL;
    if (total_replaced) {
	this_url = window.location.search.split("=")[1];
    }
    
    var my_domain = this_url.split("/")[2];
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

// If we have the informnation we need,
// then
//   go to eat_page, which
//   waits for "enough" of the page to load (with a time-out for failure)
//      ugh, it looks like we ALWAYS use the timeout, on chrome
//   then calls window.stop
//   then goes to phase_two
// else
//   call check_jQuery, which waits for jquery, and then
//   call retrieve_meta_data, which loads the same page and waits, and then
//   call eatHtml, which parses the page.
//   then start all over.


if (post_id == null || post_title == null || my_user_id == null) {
    console.log("NEED TO LOAD [ " + post_id + " / " + post_title + " / " + my_user_id);
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




// settings_changed defined in extra.js
chrome.storage.onChanged.addListener(settings_changed);

if (debug) {
    console.log("intercept normal UI here");
}

if (change_icon == false) {
    window.stop();
    // firefox still loads some of the original page in the background??
}


window.fred = 0;
// if this is acting up, check old_eat_page()
function eat_page() {
    console.log("eat page?  " + window.fred);

    window.fred += 1;
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
    console.log("document body is " + document.body);
    //console.log("document body.innerHTML is " + document.body.innerHTML);
    
    if (document && document.body) {
	let s = document.body.innerHTML.substring(0,50);
	
	console.log("CHECKING " + s);
	if (s == "<h1>Loading ACX Simple</h1>") {
	    console.log("phase 1 done, go to phase 2");
	    setTimeout( phase_two, 0);
	    return;
	}
	document.body.textContent = "";
	let header = document.createElement('h1');
	header.textContent = "Loading ACX Simple";
	document.body.appendChild(header);
    }
    if (document && document.head) {
	document.head.textContent = ""; // This does nothing, I think.
    }
    console.log("debug eat_page end");
    setTimeout( phase_two, 1);
}


// I think this should be called "mark_dot()" 
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

// This places a single new comment; get a better name
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
    let body = x.form.body.value;
    let token = null;
    let id = x.form.parent_id.value;
    let post_id = document.post_id;  // does this work?

    let url = 'https://' + my_domain + '/api/v1/post/' + post_id + '/comment'

    // TODO: make sure jQuery has loaded 
    console.log("jquery is " + jQuery);
    let  data = { body: body,
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
    
    let nid = xid.target.name; // "comment-123"
    console.log("nid is " + nid);
    $("#" + nid).off( "click" );
    let id = nid.split("-")[1];
    let url = 'https://' + my_domain + '/api/v1/comment/' + id + '/reaction';
    data = { reaction: "❤"};
    $.ajax({ type: "POST",
	     url: url,
	     async: true,
	     data: data
	     //success: TODO turn on & increment heart: function() { do_heart???(id) }
	     //failure: TODO warn user on failure
	   });
}
	
function deleet(xid) {
    console.log("delete " + xid);
    if ( confirm("Do you wish to delete this comment?") ) {
	let nid = xid.target.name; // "comment-123"
	let id = nid.split("-")[1];
	let url =  'https://' + my_domain + '/api/v1/comment/' + id;
	// TODO: replace "DELETE" button with "deleting"  
	$.ajax({ type: "DELETE",
		 url: url,
		 async: true,
		 success: function() { do_delete(id) }
		 // TODO: warn user on failure
	       });
    }
}


function edit(xid) {
    console.log("edit " + xid);
    if ( confirm("Do you wish to edit this comment?") ) {
	let nid = xid.target.name; // "comment-123"
	let id = nid.split("-")[1];
	let url =  'https://' + my_domain + '/api/v1/comment/' + id;
	let data = { body:  "XXX edit" };
	$.ajax({ type: "PATCH",
		 data: data
		 url: url,
		 async: true,
		 success: function() { do_delete(id) }
		 // TODO: warn user on failure
	       });
    }
}

function reply(xid) {
    // raw JavaScript, not jQuery. why?
    if (debug > 0) {
	console.log("reply3ing to id " + xid);
	console.log(xid);
	console.log("target is " + xid.target);
	console.log(xid.target);
	console.log("target.name is " + xid.target.name);
	console.log(xid.target.name);
    }
    let nid = xid.target.name; // "comment-123"
    let id = nid.split("-")[1];
    let newform = document.getElementById("commentor").cloneNode(true);
    //newform.style.display = "block";
    newform.parent_id.value = id;
    let target = document.getElementById(nid);
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
    let ins = target.parentElement.childNodes[2];
    if (debug > 0) {
	console.log("going to put at " + ins);
	console.log( ins );
    }
    $(newform).insertAfter( ins );
    
	
}

var global_latest = "";

// Hash of all comments, key is ID, value is date
var comment_table = { }

// Sorted array of all comment times
// UNUSED FOR NOW but hope springs eternal
var sorted_comments = [ ] 



// given a (JSON?) data structure, make an (unplaced) DOM object of a comment
function make_comment(c, flag="") {
    // TODO: Is it faster to prebuild one root comment, and then copy it?
    //       Or build one dynamically from scratch each time?
    let id = c.id;
    let dd = new Date(c.date);
    // Ugh, the instant reply I get back doesn't have a date.
    // Need to simulate a date, but that date shouldn't affect the "most
    // recently read" timer, because there could be other comments waiting

    if (comment_table[id] == undefined) {
	// firefox distribution uses "c.date undefined"? 
	//&& c.date != null && c.date != undefined)  <-- for dynamic loading
	comment_table[id] = dd;
	modded = true;
	// sorted_array.push(dd)
    } else {
	// already populated!
	return null; // this isn't right; we still need to iterate on the kids 
    }

    if (c.date > global_latest) {
	if (reload_comments && debug) {
	    console.log("NEW LATEST POST! " + id);
	}
	global_latest = c.date;
	if (debug > 0) {
	    console.log("latest comment:" + global_latest);
	}
    } 
    if (debug > 1) {
	console.log("in original make_comment " + id);
	console.log("comment is " + c);
	console.log(c);
    }

    // This is the object that gets returned.
    let comment = jQuery('<div/>', { class: "comment" } )

    let div1 = jQuery('<div/>', { id: "comment-" + id } )
    let div2 = jQuery('<div/>', { id: "comment-" + id + "-reply" } )
    let ctable = jQuery("<table/>", { class: "comment-content" })
    
    // user pic, td1
    let avatar = c.photo_url;
    let img;
    let never_load_avatars = false  // Not a user-controlled option, but it could be

    // on a fast reference machine, loading ~100 root comments with ~275 comments:
    //      * takes 800ms to render without avatars
    //      * takes 900ms to render with avatars
    // Maybe I could delay loading the avatars?
    let null_name = [" "]

    if (never_load_avatars || c.photo_url == null) {
	try {
	    let names = c.name ? c.name.split(/\s+/) : null_name;
	    letter = names.length > 1 ? names[0][0] + names[1][0] : names[0][0]
	} catch (err) {
	    console.log(err.message);
	    letter = "?";
	}
	let fakeimgclass = `fakeimg${letter.length}`
	let color = hash_color(c.name);
	let r = (color / 256 / 256);
	let g = (color / 256) % 256;
	let b = color % 256;
	let hsp = Math.sqrt(.3 * r * r + .59 * g * g + .114 * b * b);
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

    let imgwrap = jQuery('<td/>', { class: "profile-img-wrap" } ).
	append( img );
    let td1 = jQuery('<td/>', { class: "comment-head" }).
	append( jQuery('<div/>', { class: "user-head" }).
		append ( jQuery('<a/>' ).
			 append( imgwrap )));
    // comment, td2


    let td2;
    if (c.deleted) {
	// TODO: make this prettier in the UI
	td2 = jQuery ('<td/>').
	    text("deleted");
    } else {
	let score = Math.floor( c.score * 10000 ) / 100.0;
	let display_name = have_scores ? `${c.name} : ${score}` : c.name;
	let tag = (flag == "dynamic") ?
	    ( c.date < lastread ? "" : "~new~" ) :
	    flag;
	let date_s = flagged_date_string(dd, tag);
	// TODO: any difference between making this an attribute vs a JS-element property?
	let meta = jQuery('<div/>', { class: "comment-meta", zdate: c.date }).
	    append( jQuery('<span/>', { style: "font-weight: bold;" } ).
		    text( display_name )).
	    append( jQuery('<span/>', { style: "font-family: Georgia; color: #888;" } ).
		    text( date_s ));
	if (flag && false) {
	    meta.append( jQuery('<span/>').
			 text (flag) );
	}
	let cbody = jQuery('<div/>', { class: "comment-body"} ).
	    append( jQuery('<p/>').
		    text(c.body) );
	let actions = jQuery('<div/>', { class: "comment-actions"} );

	if (have_scores) {
	    let count = c.reactions["❤"];
	    let count_text = count > 0 ? `${count} ♥` : "♥";
	    // TODO: toggle when I like, and display properly
	    let anchor_like = jQuery( '<a/>', { name: "like-" + id,
						id: "like-" + id }).
		text( count_text ).
		appendTo( actions );
	    if (c.reaction != "❤") { // can't like a second time
		anchor_like.click( like );
	    }

	}
	
	jQuery( "<b>&nbsp;</b>" ).
	    appendTo( actions );

	let anchor_reply = jQuery( '<a/>', { name: "comment-" + id }).
	    text( "REPLY" ).
	    click( reply ).
	    appendTo( actions );
	
	jQuery( "<b>&nbsp;</b>" ).
	    appendTo( actions );

	
	// Only show DELETE on your own comments ;)
	if (c.user_id == my_user_id) {
	    let anchor_delete = jQuery( '<a/>', { name: "delete-" + id }).
		text( "DELETE" ).
		click( deleet ).
		appendTo( actions );
	    let anchor_edit = jQuery( '<a/>', { name: "edit-" + id }).
		text( "EDIT" ).
		click( edit ).
		appendTo( actions );
	}
	td2 = jQuery('<td/>').
	    append(meta).
	    append(cbody).
	    append(actions);
    }
    
    let row = jQuery('<tr/>' ).
	append(td1).
	append(td2);
    
    ctable.append(row);
    
    comment.append(div1).append(div2).append(ctable);
    
    if (c.children.length > 0) {
	let cl = make_comment_list_from_array(c.children);
	comment.append( cl );
    }
    
    return comment;
}

function make_comment_list_from_array(cs) {
    let comment_list = jQuery( '<div/>', { class: "comment-list" } )
    comment_list.append( jQuery( '<div/>', { class: "comment-list-collapser" } ).
			 append( jQuery('<div/>',
					{ class: "comment-list-collapser-line"} )) )
    comment_list.append( jQuery( '<div/>', { class: "comment-list-collapser hidden" } ))
    
    let comment_list_items = jQuery( '<div/>', { class: "comment-list-items" } )

    comment_order(cs).forEach( function(c) {
	comment_list_items.append( make_comment(c, "dynamic") );
    } )
    
    comment_list.append( comment_list_items );
    
    return comment_list;
}

// This waits for jQuery to load.
// TODO: Is this actually ever needed? Can't I just set the order in manifest.json?
function check_jQuery() {
    let a = typeof jQuery;
    if (debug > 0) {
	console.log("a is " + a);
    }
    if (a == "undefined") {
	setTimeout( check_jQuery, 1);
    } else {
	setTimeout( retrieve_meta_data, 1);
    }
}

// If we have not seen this post before, parse the information
function retrieve_meta_data() {
    
    console.log("could not find post_id");
    // https://astralcodexten.substack.com/api/v1/posts/apply-for-an-acx-grant
    let url = this_url;
    url = url.replace(/simple$/, '');

    // if we do not have our own user_id, load the post again.
    // TODO, if we do have user_id, see LoadPostData()
    $.ajax({
	url: url,
	success: eatHtml,
	dataType: "html"
    });
    
    if (debug) {
	console.log("wiping out document...?");
    }

    let body = document.createElement('body');
    document.body = body;
    document.body.innerHTML = "doing initial load...";
}


// ??? What is this for?
// I don't think the order matters here. This just finds unused comments.
function scan_c(c) {
    let id = c.id; // compare to start of make_comment()
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
	global_latest = c.date;
    } 
    c.children.forEach (scan_c); // recurse
}

// ??? What is scan_c versus scan_comments ?
// "scan" just means to iterate through themn
function scan_comments(data) {
    let comments = data["comments"];
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

// I think this is only called the first time
function load_comments(now = false) {
    if (!reload_comments && !now) {
	return;
    }
    post_id = document.post_id;
    url = "https://" + my_domain + "/api/v1/post/" +
	post_id +
	"/comments?token=&all_comments=true&test=4&" +
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




// before we get here 
function phase_two() {

    console.log("setting_loaded is " + settings_loaded);
    if (!settings_loaded) {
	setTimeout( phase_two, 2);
	return;
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
    <title id=title1>Simple: ` + escapeHTML(post_title) + `</title>
<!--  access these if they are neither part of manifest.json nor part of the web-accessible-resources? -->
   <link rel="stylesheet" href="style.css">
  <link rel="stylesheet" href="main.css">
  <link rel="stylesheet" href="clean.css"> 
<!-- getting rid of this empty style breaks something; I think I 
     foolishly relied on its existence in some other hack -->
<style></style>
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
   <div id=hidden>Preparing to request comments...</div>
   <div class==hidden id=JsonBlob></div>

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

	$("#hidden").text("Loaded comments, parsing them...");
	console.timeEnd('requestComments');
	console.time('parseJSON');
	resdata = data;
	if (debug || true) {
	    console.log("data is " + typeof data);
	    console.log(data);
	    $("#JsonBlob").hide().text(JSON.stringify(data));
	    // In console, type:
	    //    var b = JSON.parse($("#JsonBlob").innerHTML)
	    // to play with this.
	    console.log("status is " + status);
	    console.log("jqXHR is " + xh);
	    console.log(xh);
	}
	var comments = data["comments"];
	
	var string = "there are " + comments.length + " top comments";
	$("#hidden").text(string);
	string = this_url;
	console.timeEnd('parseJSON');	
	console.log(string);
	$( "#status" ).text(string);
	
	if (my_user_id == null || isNaN(my_user_id)) {
	    // Why do I need to set these both? What have I messed up?
	    document.getElementById("root_comment").body.value =
		document.getElementById("commentor").body.value =
		"YOU ARE NOT LOGGED IN FOR THIS SUBSTACK";
	}
	
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
	$("#hidden").hide();
    }
    
    
    console.log("trying to load comments now...");
    
    // TODO: make this call *first*, since we will end up waiting for it
    
    //	https://astralcodexten.thedispatch.com/api/v1/post/32922208/comments?token=&all_comments=true&sort=most_recent_first&last_comment_at=2021-02-27T02:53:17.654Z

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
    
    var site  = my_domain;
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
    $("#hidden").text("Requesting comments...");
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

////////////////////////////////////////////////////////////////////////////////////////////////////////////

// helper functions below which need to stay in-file

function eatHtml(data, status, xh) {
    console.log("got html response");
    if (debug > 2) {
        console.log(data);
    }
    // very crude JSON parsing, but fast. TODO: have a backup
    let i = data.indexOf('"post":');
    let id_s = '"id":';
    let j = data.indexOf(id_s, i) + id_s.length;
    post_id = parseInt(data.substr(j,20)); /* CHECK IF MUST BE VAR */
    console.log("got a post_id of " + post_id);
    let title_s = "<title data-preact-helmet>";
    let k = data.indexOf(title_s) + title_s.length;
    let k_end = data.indexOf('</title>', k+1);
    post_title = data.substring(k, k_end); /* SAME */
    
    localStorage.setItem(hpt + "-id", post_id);
    localStorage.setItem(hpt + "-title", post_title);
    
    if (my_user_id == null) {
        let user_s = '<input type="hidden" name="user_id" value="'
        let u = data.indexOf(user_s) + user_s.length;
        my_user_id = parseInt(data.substr(u, 20)); /* SAME */
        localStorage.setItem("my_user_id", my_user_id);
    }

    // XXX I really want to stop reloading here, and instead go to the magical place
    location.reload();
}
