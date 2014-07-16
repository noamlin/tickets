#!/bin/bash

APP_HOME=/opt/Dropbox/projects/tickets;
APP=$APP_HOME/index.js;
APP_LOG=$APP_HOME/logs/app.log
JXCORE=/opt/jx_rh64/jx

cd $APP_HOME;

case "$1" in

        start)
        	$JXCORE mt-keep:3 $APP >> $APP_LOG 2>&1 &
        ;;

        stop)
		echo -e "`date +%d" "%b" "%H:%M:%S` - stopping jx $APP" >> $APP_LOG
		ps -ef | grep jx | grep -v grep  | awk '{print $2}' | xargs kill -9
		echo -e "`date +%d" "%b" "%H:%M:%S` - jx $APP stopped" >> $APP_LOG
        ;;

        *)
                 echo $"Usage: $0 {start|stop}"

        exit 1
        ;;

esac
