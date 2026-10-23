#!/bin/sh
set -eu
SCRIPT_FILENAME=/var/www/html/public/index.php \
REQUEST_URI=/api/health/ready REQUEST_METHOD=GET SERVER_PROTOCOL=HTTP/1.1 \
HTTP_ACCEPT=application/json SERVER_NAME=localhost SERVER_PORT=80 \
cgi-fcgi -bind -connect 127.0.0.1:9000 | grep -q '"ready":true'
