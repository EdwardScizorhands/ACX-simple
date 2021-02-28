var debug = 1;
if (debug) {
    console.log("intercept normal UI here");
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
        <div class="comment-list-items" id="comment-list-items">
     
        </div> <!-- .comment-list-items -->
      </div> <!-- .comment-list-container -->
    </div> <!-- .container --> 
   </div> <!-- .comments-page -->
   <div id=hidden>Loading comments, this will go faster in the future, I promise...</div>
  </body>
</html>`

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

	var publish_comment = function(c) {
	    
	    var ctable = jQuery("<table/>", { class: "comment-content" })

	    // username, td1
	    var imgwrap = jQuery('<td/>', { class: "profile-img-wrap" } ).
		append( jQuery('<img/>', { src: c.photo_url } ) );
	    var td1 = jQuery('<td/>', { class: "comment-head" }).
		append( jQuery('<div/>', { class: "user-head" }).
			append ( jQuery('<a/>', { href: "" }).
				 append( imgwrap )));
	    // comment, td2
	    var cbody = jQuery('<div/>', { class: "comment-body"} ).
		append(	jQuery('<p/>').
			text(c.body)
	    );
	    var td2 = jQuery('<td/>').
		append(cbody);

	    // TODO: load all the sub-comments here!!
	
	    var row = jQuery('<tr/>', {class:"comment-head"} ).
		append(td1).
		append(td2);
	    
	    ctable.append(row).
		appendTo("#comment-list-items");
	    
	}

	cs.forEach( publish_comment );
	
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


