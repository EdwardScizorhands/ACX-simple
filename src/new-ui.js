var debug = 0;
var reload_comments = true;

if (debug) {
    console.log("intercept normal UI here");
}

window.stop();
// firefox still loads some of the original page in the background

window.fred = 0;
function eat_page() {
    // This is more complex than it has to be. But it works.
    // TODO: Figure out how to simplify but let it still work.
    window.fred += 1;
    //    console.log("eat page?  " + window.fred);
    if (window.fred > 20) {
	setTimeout( phase_two, 0);
	return;
    }
    if (document.body == null) {
	//	console.log("not loaded yet");
	setTimeout(eat_page, 1);
	return;
    }
    console.log("prep");
    console.log("document body is " + document.body);
    console.log("document body.innerHTML is " + document.body.innerHTML);
    
    var s = document.body.innerHTML.substring(0,50);
    console.log("CHECKING " + s);
    if (s == "<h1>Loading ACX Simple</h1>") {
	console.log("phase 1 done, go to phase 2");
	setTimeout( eat_page, 0);
//	setTimeout( phase_two, 0);
	return;
    }
    document.body.textContent = "";
    var header = document.createElement('h1');
    header.textContent = "Loading ACX Simple";
    document.body.appendChild(header);
    setTimeout(eat_page, 1);
}
setTimeout(eat_page, 0);

function new_comments2(data) {
    if (debug > 0) {
	console.log("New comment is " + data);
	console.log(data);
	console.log(JSON.stringify(data));
    }
    var zap =  make_comment(data, "~new~");
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
    if (debug > 0) {
	console.log("trying to submit: " + x);
	console.log(x);
	document.abc = x; // so the console can play with it. (Does this work?)
	   
    }
    x.disabled = true; // no double posts.
    var body = x.form.body.value;
    var token = null;
    var id = x.form.parent_id.value;
    var post_id = document.post_id;  // does this work?

    var url = 'https://astralcodexten.substack.com/api/v1/post/' + post_id + '/comment'

    // TODO: make sure jQuery has loaded 
    
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


function deleet(xid) {
    console.log("delete " + xid);
    if ( confirm("Do you wish to delete this comment?") ) {
	var nid = xid.target.name; // "comment-123"
	var id = nid.split("-")[1];
	var url = 'https://astralcodexten.substack.com/api/v1/comment/' + id;
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
	console.log(global_latest);
    } 
    if (debug > 0) {
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
    if (c.photo_url != null) {
	img = jQuery('<img/>', { src: c.photo_url } );
    } else {
	letter = c.name ? c.name[0] : "";
	img = jQuery('<span/>', { class: "fakeimg" } ).
	    text( letter );
    }
//    console.log("c.photo_url is " + c.photo_url);
    var imgwrap = jQuery('<td/>', { class: "profile-img-wrap" } ).
	append( img );
    var td1 = jQuery('<td/>', { class: "comment-head" }).
	append( jQuery('<div/>', { class: "user-head" }).
		append ( jQuery('<a/>', { href: "" }).
			 append( imgwrap )));
    // comment, td2


    var td2;
    if (c.deleted) {
	// TODO: make this neater
	// TODO: hide if all children deleted
	td2 = jQuery ('<td/>').
	    text("deleted");
    } else {
	var date_s = dd.toDateString() + " " + dd.toLocaleTimeString() + " " + flag;
	var meta = jQuery('<div/>', { class: "comment-meta"}).
	    append( jQuery('<span/>', { style: "font-weight: bold;" } ).
		    text( c.name )).
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
    cs.forEach( function(c) {
	comment_list_items.append( make_comment(c) );
    } )
    
    comment_list.append( comment_list_items );
    
    return comment_list;
}


var post_slug = document.URL.split("/")[4];
var hpt = btoa(post_slug);
var post_id = localStorage.getItem(hpt+"-id");
var post_title = localStorage.getItem(hpt+"-title");
var my_user_id = localStorage.getItem("my_user_id");

if (post_id == null || post_title == null || my_user_id == null) {
    setTimeout( check_jQuery, 0 );
}

function check_jQuery() {
    var a = typeof jQuery;
    console.log("a is " + a);
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
    
        
    var url = document.URL;
    url = url.replace(/simple$/, 'comments');
    
    if (debug) {
	console.log(url);
	console.log("wiping out document...?");
    }
    
    var body = document.createElement('body');
    document.body = body;
    console.log("burp");

    console.log("wiped?");
    
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
	
	
	// TODO: temporarily disable this, and debug extra crap that happens
	location.reload();
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

function scan_c(c) {
    var id = c.id; // compare to start of make_comment()
    if (comment_table[id] == undefined) {
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

function dump_it(data, status, xh ) {
    if (data.comments !== undefined) {
	console.log("data length is " + data.length);
	console.log(xh.getResponseHeader("date"));
	console.log("==");
	console.log(xh); 
	console.log("DUMP IT " + JSON.stringify(data));
	scan_comments(data);
    } else {
	console.log("nuthin'");
    }
    setTimeout( spin_comments, 8000 );
}

function load_comments() {
    post_id = document.post_id; 
    url = "https://astralcodexten.substack.com/api/v1/post/" +
	post_id +
	"/comments?token=&all_comments=true&" +
	"sort=most_recent_first&last_comment_at=" + global_latest;
    $.ajax({
	url: url,
	success: dump_it,
	dataType: "json"
    })
}
function spin_comments() {
    setTimeout( load_comments, 3000 );
}


function phase_two() {

//    if (post_id != null) {

    console.log("post_title is " + post_title);
    console.log("post_id is " + post_id);

    document.post_id = post_id;

    // TODO: put into its own file
    newHTML = `<html>
  <head>
    <title id=title1>Simple ACX: ` + escapeHTML(post_title) + `</title>
<style>.comment-body p {
white-space: pre;
white-space: pre-line;
} </style>
  </head>
  <body>


<div style="background-color:white; width:100%"><span id=status style="text-align:left;">status goes here</span><span style="float:right; display:none;">New Comments:<button style="display:none;" name="checknow">Check Now</button></span></div>
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
    var body = document.createElement('body');
    document.body = body;
    
    document.body.innerHTML = newHTML;

    // is this the proper scope?


    
    
    // obj data, string status, jqXHR xh
    function eatJson(data, status, xh) {
	resdata = data;
	if (debug) {
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
	console.log(string);
	$( "#status" ).text(string);

	var cs = data.comments;


	// returns a function that appends to the comment
	var append_comment_factory = function(parent_comment) {
	    return function(c) {


		var ctable = make_comment(c);

		if (debug) {
		    console.log("length of children is " + c.children.length);
		}
		// if we have children: append them
//		if (c.children.length > 0) {
//		    var cl = make_comment_list_from_array(c.children);
//		    ctable.append( cl );
//		}
		ctable.appendTo(parent_comment);

//		c.children.forEach( append_comment_factory(ctable) );
	    }
	}

	// how to do this right:
	// 1. for each comment-array, make a COMMENT-LIST object
	//     (verify that for one-comment arrays)
	// 2. append that comment-list into (a) parent COMMENT
	//     or (b) COMMENT-LIST-CONTAINER (for first array)
	

	cs.forEach( append_comment_factory( $("#comment-list-items") ) );


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
    
    var site = "astralcodexten.substack.com";
    var args = "?token=&all_comments=dummy&sort=most_recent_first&last_comment_at=2021-02-27T02:53:17.654Z";
    var url = "https://" + site + "/api/v1/post/" + post_id + "/comments? " + args;
    
    if (debug) {
	console.log("making ajax");
    }
    $.ajax({
	url: url,
	success: eatJson,
	dataType: "json"
    })
    
    // is this inefficient by making a reply function that will get cloned
    // and overwritten on each "reply" ?
    // TODO: have a base "commentor" that everything, including this, gets cloned from
    // copy the hidden form and post it, then edit it
    var new_root = document.getElementById("commentor").cloneNode(true);
//    new_root.style.display = "block";
    document.getElementById("newrootcomment").append( new_root );
    var root_reply = new_root.post;
    root_reply.addEventListener("click", function(){
	submit_comment2(root_reply);
    });
    
}



