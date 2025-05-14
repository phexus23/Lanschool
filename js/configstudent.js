/** capture student configuration from meta data 
 * Originated by Stoneware, Inc.  http://www.stone-ware.com
 *
 * The enclosed material is Stoneware Confidential and is the sole
 * property of Stoneware, Inc.  Unauthorized disclosure, distribution
 * or other use of this material is expressly prohibited.
 *
 * (c) Copyright 1999-2014 Stoneware, Inc.  All rights reserved.
 *
 ***/

var meta = document.querySelector("meta[name=\'studentconfig\']");
var data = null;

if ( meta )
{
	if (meta instanceof Array) 
		data = meta[0].getAttribute('contents');
	else
		data = meta.getAttribute('contents');
	if ( data )
	{
		console.log( "Found an autoconf: " + data );
		chrome.runtime.sendMessage( { message: "student_config", data: data, hostname: location.hostname } );
	}
}