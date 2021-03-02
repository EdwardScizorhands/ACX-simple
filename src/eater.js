
window.fred = 0;

function eat_page() {
    window.fred += 1;
    console.log("fred is " + window.fred);
    
    if (window.fred > 20) return;

    if (document.body == null) {
	console.log("waiting");
	setTimeout(eat_page, 1);
    } else {
	console.log("time to eat!");

	var b = document.body;
	var s = b.innerHTML.substring(0,50);

	if (s == "<h1>This page has been eaten!!</h1>") {
	    console.log("****************************************************************");
	    return;
	}
	console.log(s);
	document.body.textContent = "";
	var header = document.createElement('h1');
	header.textContent = "This page has been eaten!!";
	document.body.appendChild(header);
	setTimeout(eat_page, 1);
    }
}

setTimeout(eat_page, 0);

