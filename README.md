# ACX-simple

Simple interface for ACX comments

Installing this won't run anything unless you go to the comments-only page you probably weren't using.

## How to install

*Install on Chrome:*

1. Go to the [releases page](https://github.com/EdwardScizorhands/ACX-simple/releases/tag/test1) Then scroll down to the assets and grab the latest ACX-Simple-src-(date).zip file.
2. Unzip it.
3. Browse to chrome://extensions/ and click the slider in the upper-right to "Developer Mode."
4. Select "Load Unpacked", and select the **src** directory you unzipped in step 2.

*Install on Firefox:*

Go to [releases page](https://github.com/EdwardScizorhands/ACX-simple/releases/tag/test1) and install the signed acx_simple-0.4.15.0-an+fx.xpi right in Firefox.

## How to use

Whenever you want to use it, add "/comments" to the end of a URL.

* So if the URL ends in "open-thread-1620"
* Change the end to go to "open-thread-1620/comments"

Example: https://astralcodexten.substack.com/p/links-for-march/comments

You can also click on the 💬 speech bubble on the substack page, which automatically takes you to comments.

## Notes

* You can also go to "/simple" instead of "/comments". I may migrate there at some point in the future so as to not override Substack's comments-only page.

*  It dynamically loads new comments (which breaks if you lose internet connectivity). They are marked as “∼new∼" if loaded in the background. You can disable this and manually check, or just reload the page. 

* The "~new~" tag works on the timestamp in the upper-right. When you've read all the comments, click "Set to Now" and "Apply" and you should only have 1 "~new~" post left.

* You can change the sort order, hearts, and dynamic loading of checkboxes in the settings box (click on the icon).

* **You need to reload the page after changing settings.** It doesn't have to be that way, but for now it's the way it is.

* Making hearts and scores show up for yourself still doesn't make them show up for others.

* The "score" is the internal Substack score, multipled by a factor to not be useless. Substack calculates it as some kind of function of the number of likes and age. You'll have to ask them how it works.

* You need to already be logged in to Substack or else the script goes nuts. Sorry, this is a bug I should fix.
 
* I *think* this works just fine if ACX-tweaks is also installed, and fine if it isn't.

* I clumsily reload the page in the background to get a URL -> postID mapping. Pycea has said the better way to do this but I need to implement it.


