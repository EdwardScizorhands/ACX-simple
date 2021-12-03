#! /bin/sh

if test -f README.md
then
    echo "in right directory..."
else
    echo "Please run from root of project."
    exit 1
fi

if  which jq 
then
    echo "we have jq..."
else
    echo "please install jq"
    exit
fi

version=$(jq -r .version src/manifest.json)
date=$(date "+%Y-%m-%d")
temp_dir=ACX-Simple-src-$version-$date
zip_file=ACX-Simple-src-$version.zip
firefox_file=ACX-Simple-firefox-$version.xpi
chrome_file=ACX-Simple-chrome-$version.zip

mkdir $temp_dir
mkdir $temp_dir/src
mkdir $temp_dir/src/icons

# Need to keep this up-to-date. Can I compare with manifest.json?
# Also, should make this an array stored at the top.

cp src/manifest.json \
   src/jquery-3.5.1.min.js \
   src/background.js \
   src/simple2.html \
   src/main.css  src/style.css src/clean.css \
   src/new-ui.js src/popup.html src/popup.js src/common.js   $temp_dir/src
cp src/icons/acf-simple-128.png \
   src/icons/acf-simple-mod-128.png \
   src/icons/acx-standard-96.png \
   src/icons/acx-standard-mod-96.png    $temp_dir/src/icons

# Firefox xpi DOES THIS STILL WORK?
(cd $temp_dir/src/;
 zip -r ../../$firefox_file . ;
 cd ../..)
mv $firefox_file dist
# need to manually upload to addons.mozilla.org for signing

# Chrome zip, still need to upload
(cd $temp_dir/src/;
 zip -r ../../$chrome_file . ;
 cd ../..)
mv $chrome_file dist




# Chrome-based unpacked extension, I think this is useless
zip -r $zip_file $temp_dir
mv $zip_file ./dist


# rm -rf is dangerous
trash_dir=$(mktemp -d /tmp/trashXXXXXXXX)
mv $temp_dir $trash_dir # Safer way to "delete" files.






