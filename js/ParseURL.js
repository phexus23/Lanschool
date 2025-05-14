/**
 * Simple function to parse a URL and return an array of parameters.
 * 
 */

function URLObject ()
{
	this.prot = "";
	this.host = "";
	this.port = "";
	this.path = "";
	this.extra = "";
	this.url = "";
	this.params = [];
	this.isIP = false;
}


function parseURL(url)
{
	console.log("parsing URL [" + url + "]");
	var queryStart = url.indexOf("?") + 1;
	var queryEnd   = url.indexOf("#") + 1 || url.length + 1;
	var query      = url.slice(queryStart, queryEnd - 1);

	if (query === url || query === "")
		return null;

	var params  = {};
	var nvPairs = query.replace(/\+/g, " ").split("&");

	for (var i = 0; i < nvPairs.length; i++) {
		var nv = nvPairs[i].split("=");
		var n  = decodeURIComponent(nv[0]);
		var v  = decodeURIComponent(nv[1]);

		if (!(n in params)) {
			params[n] = [];
		}
		
		params[n].push(nv.length === 2 ? v : null);
	}
	
	return params;
}

function parseURLex(url)
{
	var u = new URLObject();
	const urlToParse = new URL(url);

	if (urlToParse.protocol)
		u.prot = urlToParse.protocol;
	else
		u.prot = "http";

	u.host = urlToParse.hostname;
	u.port = urlToParse.port;
	u.path = urlToParse.pathname;
	u.extra = urlToParse.search;

	var p = [];
	var ipreg = /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/;
	
	u.isIP = ( ipreg.exec( u.host ) == null ) ? false : true;
	
	u.url = u.host + u.path + u.extra;
	
	if (u.extra && u.extra.length > 0)
	{
		p = parseURL(u.extra);
		if (p)
			u.params = p;
		else
			u.params = {};
	}
	else
		u.params = {};
	
	if ( u.port === "" )
		u.port = "80";

	return u;
}

function dumpURLParts( u )
{
	console.log( "Protocol: " + u.prot );
	console.log( "Host:     " + u.host );
	console.log( "Port:     " + u.port );
	console.log( "Path:		" + u.path );
	console.log( "Extra:	" + u.extra );
	console.log( "IsIP:	    " + u.isIP );
	
	var keys = Object.keys( u.params );
	console.log( "Path:		" + u.path );
	//for ( var x = 0, cnt = u.params.length; x < cnt; x ++ )
	if ( keys.length > 0 )
	{
		for( var key in u.params )
		{
			console.log( "Param: " + key + " => " + u.params[key] );
		}
	}	
}

function testParseURL( )
{
	var u = parseURLex( "http://www.lanschool.com" );
	dumpURLParts( u );
	
	var v = parseURLex( "https://www.gden.com:443/test.html/mystuff/washere" );
	dumpURLParts( v );

	var v = parseURLex( "ftp://ftp.fred.com:8001/test.html?this=that&fred=flintstone&barney=rubble" );
	dumpURLParts( v );

	var v = parseURLex( "http://10.0.0.4/fred.html?joe=5" );
	dumpURLParts( v );

}
