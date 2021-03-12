# ACX-simple

Simple interface for ACX comments

Installing this won't run anything unless you go to the comments-only page you probably weren't using.

## How to install and use

For Chrome:

1. Go to the [releases page](https://github.com/EdwardScizorhands/ACX-simple/releases/tag/unpacked1) Then scroll down to the assets and grab the latest ACX-Simple-src-(date).zip file.
2. Unzip it.
3. Browse to chrome://extensions/ and click the slider in the upper-right to "Developer Mode."
4. Select "Load Unpacked", and select the **src** directory you unzipped in step 2.

For Firefox:

1. Go to the [releases page](https://github.com/EdwardScizorhands/ACX-simple/releases/tag/unpacked1) Then scroll down to the assets and download the ACX-Simple-firefox-(date).xpi to some folder.
2. Browse to about:debugging, click "This Firefox" on the left.
3. Click "Load Temporary Add-on", and select the XPI file. 

Then, whenever you want to use it, add "/comments" to the end of a URL:

* So if the URL ends in "open-thread-1620"
* Change the end to go to "open-thread-1620/comments"

Example: https://astralcodexten.substack.com/p/links-for-march/comments


## Notes

* For a given ACX post, add "/comments" to the end to load the simple UI.
  * Did you know there was already a page there? That's the one I overwrite. I didn't even know about it when I started.

* You can also go to "/simple" instead of "/comments". I may migrate there at some point in the future so as to not override Substack's comments-only page.

* It dynamically loads new comments (which breaks if you lose internet connectivity). They are marked as “∼new∼" if loaded in the background. I know that still needs a better workflow.

* You can change the sort order, hearts, and dynamic loading of checkboxes in the settings box (click on the icon).

* **You need to reload the page after changing settings.** It doesn't have to be that way, but for now it's the way it is.

* Making hearts and scores show up for yourself still doesn't make them show up for others.

* The "score" is the internal Substack score, multipled by a factor to not be useless. Substack calculates it as some kind of function of the number of likes and age. You'll have to ask them how it works.
 
* I *think* this works just fine if ACX-tweaks is also installed, and fine if it isn't.

* I clumsily reload the page in the background to get a URL -> postID mapping. Is there a better way to do this? At least I only have to do it once.

* There is an ugly background border just offset from photo images. I suck at CSS; can you figure out how to remedy this? I copied in both the main.css (from Substack) and the styles.css (from ACX-Tweaks) and edited both and something broke.

