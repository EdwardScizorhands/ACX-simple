var debug = 1;
if (debug) {
    console.log("intercept normal UI here");
}

function make_comment(c) {
    // TODO: Is it faster to prebuild a comment, and then copy it?
    var id = c.id;

    var comment = jQuery('<div/>')
    
    var div1 = jQuery('<div/>', { class: "comment-" + id } )
    var div2 = jQuery('<div/>', { class: "comment-" + id + "-reply" } )
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
	html( "<i>Reply</i>");
    var td2 = jQuery('<td/>').
	append(meta).
	append(cbody).
	append(actions);
    
    
    // TODO: load all the sub-comments here!!
    
    var row = jQuery('<tr/>', {class:"comment-head"} ).
	append(td1).
	append(td2);

    ctable.append(row);

    comment.append(div1).append(div2).append(ctable);
    
    return comment;
}

function make_comment_list_from_array(cs) {
    var comment_list = jQuery( '<div/>', { class: "comment-list" } )
    comment_list.append( jQuery( '<div/>', { class: "comment-list-collapser" } ))
    comment_list.append( jQuery( '<div/>', { class: "comment-list-collapser hidden" } )) // check this DTRT

    var comment_list_items = jQuery( '<div/>', { class: "comment-list-items" } )
    cs.each( function(c) {
	comment_list_items.append( make_comment(c) );
    } )

    comment_list.append( comment_list_items );

    return comment_list;
}


var post_title = document.URL.split("/")[4];
var hpt = btoa(post_title);
var post_id = localStorage.getItem(hpt);
if (post_id == null) {
    console.log("could not find post_id");
    // Yo dawg, load the same page we are on
    // (Is there a better way to do this? Can I read the HTML somehow?)

        
    var url = document.URL;

    if (debug) {
	console.log(document.URL);
	console.log("wiping out document");
    }
    document.open()
    document.write("<html><body><p>hold on, one-time init for this page...</p></body></html>");
    document.close()

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
	localStorage.setItem(hpt, post_id);
	location.reload();
    }
    
    $.ajax({
	url: url,
	success: eatHtml,
	dataType: "html"
    });
    
}
if (post_id != null) {

    console.log("post_title is " + post_title);
    console.log("post_id is " + post_id);
    
    // TODO: put into its own file
    newHTML = `<html>
  <head>
    <title>A Simple HTML Document</title>
<style>.comment-body p {
white-space: pre;
white-space: pre-line;
} </style>
  </head>
  <body>
<div id=status>status goes here </div>
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
    
    document.open()
    document.write(newHTML)
    document.close()
    
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

	var cs = data.comments;


	// returns a function that appends to the comment
	var append_comment_factory = function(parent_comment) {
	    return function(c) {


		var ctable = make_comment(c);
		ctable.appendTo(parent_comment);

		// temporarily remove
		c.children.forEach( append_comment_factory(ctable) );
	    }
	}

	// how to do this right:
	// 1. for each comment-array, make a COMMENT-LIST object
	//     (verify that for one-comment arrays)
	// 2. append that comment-list into (a) parent COMMENT
	//     or (b) COMMENT-LIST-CONTAINER (for first array)
	

	cs.forEach( append_comment_factory( $("#comment-list-items") ) );
	
    }
    
    var letrun = true;
    
    if (letrun) {
	
	$.ajax({
	    url: "https://astralcodexten.substack.com/api/v1/post/" + post_id + "/comments?token=&all_comments=true&sort=most_recent_first&last_comment_at=2021-02-27T02:53:17.654Z",
	    success: eatJson,
	    dataType: "json"
	})
	
    }
    
}


