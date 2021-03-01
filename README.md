# ACX-simple

Simple interface for ACX comments

Installing this won't run anything unless you go to the comments-only page you probably weren't using.

## How to install and use

Grab the repository and then "load unpacked extension" in Chromium-based browsers on the "src" directory.

Then add "/comments" to the end of a URL:

* So if the URL ends in "open-thread-1620"
* Change the end to go to "open-thread-1620/comments"

## Notes

* For a given ACX post, add "/comments" to the end to load the simple UI.
  * Did you know there was already a page there? That's the one I overwrite. I didn't even know about it when I started.

* It dynamically loads your own comments, but it doesn't dynamically load other comments. Just like the original SSC, which makes me think it's good enough to ask for feedback.

* (It looks like you have to grab *all* the comments each time you want new ones? No wonder they don't let you edit comments!)

* You can't delete your own comments.

* I *think* this works just fine if ACX-tweaks is also installed, and fine if it isn't.

* I clumsily reload the page in the background to get a URL -> postID mapping. Is there a better way to do this? At least I only have to do it once.

* There is an ugly background border just offset from photo images. I suck at CSS; can you figure out how to remedy this? I copied in both the main.css (from Substack) and the styles.css (from ACX-Tweaks) and edited both and something broke.

* JavaScript scope. Hoo boy, this is always fun. I hate "new-ui.js" totally replace the standard UI with document.write(), and it also has some JavaScript functions to populate comments. However, the *scope* for the document I create is obviously different than the scope of my original file. I duplicated some code that I needed in both scopes. What's the best thing here?
  * Cut-and-paste duplicate code. (What I'm currently doing, and wrong.)
  * Create all the JavaScript in the second scope. This feels crude.
  * Pass through bindings to preserve the original scope so I can still call it.
  * Something else?

* Possibly related to the above, but DOM objects made with jQuery in the first scope are directly useable, but in the second scope they come back as a one-element array. Why is that?
