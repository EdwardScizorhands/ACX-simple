
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
