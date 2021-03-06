#! /bin/sh

if test -f README.md
then
    echo "in right directory..."
else
    echo "Please run from root of project."
    exit 1
fi

