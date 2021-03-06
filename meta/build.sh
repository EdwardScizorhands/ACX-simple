#! /bin/sh

if test -f README.md
then
    echo "in right directory..."
else
    echo "Please run from root of project."
    exit 1
fi

date=$(date "+%Y-%m-%d")
temp_dir=ACX-Simple-src-$date
zip_file=ACX-Simple-src-$date.zip
firefox_file=ACX-Simple-firefox-$date.xpi

mkdir $temp_dir
mkdir $temp_dir/src
mkdir $temp_dir/src/icons

# Need to keep this up-to-date. Can I compare with manifest.json?
# Also, should make this an array stored at the top.

cp src/manifest.json \
   src/jquery-3.5.1.min.js \
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


# Chrome-based unpacked extension
zip -r $zip_file $temp_dir
mv $zip_file ./dist


# rm -rf is dangerous
trash_dir=$(mktemp -d /tmp/trashXXXXXXXX)
mv $temp_dir $trash_dir # Safer way to "delete" files.






