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
firefox_file=ACX-Simple-$date.xpi

mkdir $temp_dir

# Need to keep this up-to-date. Can I compare with manifest.json?
# Also, should make this an array stored at the top.

cp src/eater.js src/icons src/jquery-3.5.1.min.js src/main.css src/manifest.json src/new-ui.js src/page-eater.js src/style.css src/icons/acf-simple-128.png $temp_dir

# Chrome-based unpacked extension
zip -r $zip_file $temp_dir
mv $zip_file ./dist

# Firefox xpi
(cd $temp_dir;
 zip -r ../$firefox_file . ;
 cd ..)
mv $firefox_file dist

# rm -rf is dangerous
trash_dir=$(mktemp -d /tmp/trashXXXXXXXX)
mv $temp_dir $trash_dir # Safer way to "delete" files.






