var firefox = true;
var debug = 0;

if (debug) {
    console.log("intercept normal UI here");
}
console.log("starting");
window.stop();
console.log("continuing...");

window.fred = 0;
function eat_page() {
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

  // oh, shoot, I don't have my old function in scope :< 
  console.log("NEW COMMENT");
  console.log(data);
  console.log("XXX");
  console.log(JSON.stringify(data));
  console.log("DONE");
  var zap =  make_comment(data);
  console.log("zap is " + zap);
  console.log(zap);
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

  console.log("parent_node is " + parent_node);
  console.log(parent_node);

  // find the parent, then make a 4th node if it doesn't exist.
  var dad = parent_node.parentElement;
  console.log(dad);
  var kids = dad.childNodes;
  if (debug == 1) {
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
   if (debug == 1) {
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

  console.log("all done");
}



function submit_comment2(x) {
    console.log("trying to submit");
    console.log(x);
  document.thingy = x;
  x.disabled = true; // no double posts.
  var body = x.form.body.value;
  var token = null;
  var id = x.form.parent_id.value;
    var post_id = document.post_id; // whoops
    
  var url = 'https://astralcodexten.substack.com/api/v1/post/' + post_id + '/comment'
  // todo: make sure jQuery has loaded 

  console.log("id is " + id);
  var  data = { body: body,
                token: token,
                parent_id: id };
  console.log("posting to " + url + " with " + data);
  console.log(data);
  $.ajax({ type: "POST",
           url: url,
           data: data,
           datatype: "json",
           success: new_comments2
  // TODO: warn user on failure
	 });
	   
    console.log("done... what now?");
    return true;
    
}



function reply3(xid) {
    // raw JavaScript, not jQuery
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
    console.log("going to put at " + ins);
    console.log( ins );
    $(newform).insertAfter( ins );
    
	
}

function make_comment(c) {
    // TODO: Is it faster to prebuild a comment, and then copy it?
    var id = c.id;
    var dd = new Date(c.date);
    if (debug > 0) {
	console.log("in original make_comment " + id);
	console.log("comment is " + c);
	console.log(c);
    }
    
    var comment = jQuery('<div/>', { class: "comment" } )
    
    var div1 = jQuery('<div/>', { id: "comment-" + id } )
    var div2 = jQuery('<div/>', { id: "comment-" + id + "-reply" } )
    var ctable = jQuery("<table/>", { class: "comment-content" })
    
    // username, td1
    var imgwrap = jQuery('<td/>', { class: "profile-img-wrap" } ).
	append( jQuery('<img/>', { src: c.photo_url } ) );
    var td1 = jQuery('<td/>', { class: "comment-head" }).
	append( jQuery('<div/>', { class: "user-head" }).
		append ( jQuery('<a/>', { href: "" }).
			 append( imgwrap )));
    // comment, td2
    
    var meta = jQuery('<div/>', { class: "comment-meta"}).
	append( jQuery('<span/>', { style: "font-weight: bold;" } ).
		text( c.name )).
	append( jQuery('<span/>', { style: "font-family: Georgia; color: #888;" } ).
		text( dd.toDateString() + " " + dd.toLocaleTimeString() ));
    var cbody = jQuery('<div/>', { class: "comment-body"} ).
	append( jQuery('<p/>').
		text(c.body) );
    var actions = jQuery('<div/>', { class: "comment-actions"} );
    var anchor = jQuery( '<a/>', { name: "comment-" + id }).
	text( "REPLY" ).
	click( reply3 ).
	appendTo( actions );
    
    var td2 = jQuery('<td/>').
	append(meta).
	append(cbody).
	append(actions);
    
    
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

if (post_id == null || post_title == null) {
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
    
    if (firefox) {
	// deleted
	var body = document.createElement('body');
	document.body = body;
    }
    console.log("burp");
    if (!firefox) {
	document.open()
	console.log("!");
	document.write("<html><body><p>hold on, one-time init for this page...</p></body></html>");
	document.close()
    }
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

<script>

document.post_id = ` + post_id + `;
//alert("xxx");
document.log("this code never runs.");

//Load jQuery library using plain JavaScript
</script>

<script>

console.log("defining reply");

</script>

<script>
 // okay, I apologize sincerely for this duplicate code. I think I 
 // can fix this by setting up listeners in *this* scope.




function make_comment_obsolete(c) {
    // TODO: Is it faster to prebuild a comment, and then copy it?
   console.log("in dupe code!");
    var id = c.id;

    var comment = jQuery('<div/>', { class: "comment" } )
    
    var div1 = jQuery('<div/>', { id: "comment-" + id } )
    var div2 = jQuery('<div/>', { id: "comment-" + id + "-reply" } )
    // I skipped comment-123 and comment-123-reply
    var ctable = jQuery("<table/>", { class: "comment-content" })
    
    // username, td1
    var imgwrap = jQuery('<td/>', { class: "profile-img-wrap" } ).
	append( jQuery('<img/>', { src: c.photo_url } ) );
    var td1 = jQuery('<td/>', { class: "comment-head" }).
	append( jQuery('<div/>', { class: "user-head" }).
		append ( jQuery('<a/>', { href: "" }).
			 append( imgwrap )));
    // comment, td2
    var meta = jQuery('<div/>', { class: "comment-meta"}).
	text( c.name, { style: "font-weight: bold;" });
    var cbody = jQuery('<div/>', { class: "comment-body"} ).
	append( jQuery('<p/>').
		text(c.body) );
    var actions = jQuery('<div/>', { class: "comment-actions"} ).
	html( '<a style="font-style:italic;" href="javascript:reply(' + id  + ')">Reply</a>');
    var td2 = jQuery('<td/>').
	append(meta).
	append(cbody).
	append(actions);
    
    
    // TODO: load all the sub-comments here!!
    
    var row = jQuery('<tr/>' ).
	append(td1).
	append(td2);

    ctable.append(row);

    comment.append(div1).append(div2).append(ctable);
    
    return comment;
}


// just takes 1 single comment


</script>

<div id=status>status goes here </div>
<form id=commentor method="post" class="form comment-input" novalidate="">
<input type=hidden value=123 name=parent_id />

<div class="comment-input-head"><div class="user-head "><a href=""><div class="profile-img-wrap">
<div>→</div>
</div></a></div></div><textarea name="body" placeholder="Write a comment…" value="" style="height: 37px;"></textarea><div id="error-container"></div>
<button tabindex="0" class="button primary " type="button" name="post"">Post</button>
<button tabindex="0" class="button " style="display:none;" type="button" name="cancel"">Cancel</button>
</form>




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
      1: div comment-list-collapser          (line to click)
      2: div comment-list-collapser hidden   (UNKNOWN)
      3. div comment-list-items              (all the comments)

      EACH COMMENT-LIST-ITEMS (vertically)
      *. div comment                         (1 or more -- right?)

      EACH COMMENT contains
      1: div   comment-123        (anchor)
      2: div   comment-123-reply  (anchor)
      3: table comment-content
      ? sometimes, a FORM element. What order?
      4: div   comment-list      IFF there are children

	
      EACH COMMENT-CONTENT contains a TR which contains
      1. td comment-head (picture)
      2. td smurf   (the comment) (smurf is my name)
      
      EACH SMURF contains (vertically)
      1. div comment-meta      (author and timestamp)
      2. div comment-body      (actual contents of comment)
      3. div comment-actions   (reply, parent, ❤)
      
      PLEASE TAKE NOTES, THERE WILL BE A SHORT QUIZ
      
       */

    if (!firefox) {
	document.open()
	document.write(newHTML)
	document.close()
    }
    console.log("466: document.body is " + document.body);
    if (firefox) {
//	console.log("eating body again!");
//	document.body.textContent = "";
//	var header = document.createElement('h1');
//	header.textContent = "This page has been eaten, part 2";
//	document.body.appendChild(header);
	var body = document.createElement('body');
	document.body = body;

	document.body.innerHTML = newHTML;
    }

    function reply2(x) {
	console.log("clicked on reply?");
    }

    // is this the proper scope?


    
    
    // obj data, string status, jqXHR xh
    function eatJson(data, status, xh) {
	console.log("data length is " + typeof data);
	resdata = data;
	if (debug) {
	    console.log(data);
	    $("#hidden").hide().text(JSON.stringify(data));
	    console.log("status is " + status);
	    console.log("jqXHR is " + xh);
	    console.log(xh);
	}
	var comments = data["comments"];
	
	var string = "there are " + comments.length + " top comments";
	console.log(string);
	$( "#status" ).text(string);

	$( "#status" ).click( reply2 );
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
	
    }
    
    
    console.log("trying to load comments now...");
    console.log("jquery is " + typeof jQuery);
    var letrun = true;
    
    // TODO: make this call *first*, so we can be ready for it
    
    if (letrun) {
//	https://astralcodexten.substack.com/api/v1/post/32922208/comments?token=&all_comments=true&sort=most_recent_first&last_comment_at=2021-02-27T02:53:17.654Z
	
	var site = "astralcodexten.substack.com";
	var args = "?token=&all_comments=dummy&sort=most_recent_first&last_comment_at=2021-02-27T02:53:17.654Z";
	var url = "https://" + site + "/api/v1/post/" + post_id + "/comments? " + args;

	console.log("making ajax");
	$.ajax({
	    url: url,
	    success: eatJson,
	    dataType: "json"
	})
	
    }

    // is this inefficient by making a reply function that will get cloned
    // and overwritten on each "reply" ?
    var root_reply = document.getElementById("commentor").post;
    root_reply.addEventListener("click", function(){
	submit_comment2(root_reply);
    });
    
}


