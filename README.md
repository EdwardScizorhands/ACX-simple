# ACX-simple

Simple interface for ACX comments

Installing this won't run anything unless you are using the "/comments" page.

* So if the URL ends in "open-thread-1620"
* Change the end to go to "open-thread-1620/comments"

## How to install

Grab the repository and then "load unpacked extension" in Chromium-based browsers on the "src" directory.

## Notes

* For a given ACX post, add "/comments" to the end to load the simple UI.
  * Did you know there was already a page there? That's the one I overwrite. I didn't even know about it when I started.

* It dynamically loads your own comments, but it doesn't dynamically load other comments. Just like the original SSC, which makes me think it's good enough to ask for feedback.

* (It looks like you have to grab *all* the comments each time you want new ones? No wonder they don't let you edit comments!)

* You can't delete your own comments.

* I *think* this works just fine if ACX-tweaks is also installed, and fine if it isn't.

* I clumsily reload the page in the background to get a URL -> postID mapping. Is there a better way to do this? At least I only have to do it once.

* There is an ugly background border just offset from photo images. I suck at CSS; can you figure out how to remedy this? I copied in both the main.css (from Substack) and the styles.css (from ACX-Tweaks) and edited both and something broke.

