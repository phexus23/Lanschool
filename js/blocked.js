var action = "blocked";
var action_url = "";
var site_list = "";
var list_type = 0;
var event_index = 0;

var BLOCK_ALL = 1;
var ALLOW_SPECIFIC = 2;
var BLOCK_SPECIFIC = 3;
var NO_IP_ADDRESS = 4;


function main()
{	
    var header = document.getElementById( 'index_title' );
    var blocked = document.getElementById( 'blocked_text' );

    var available_text = "No content loaded yet";

    var params = parseURL( document.URL );

    if ( params != null )
    {
//            action = params.action;
//            action_url = params.url;
        event_index = params.index;
//            site_list = new String(params.sites);
    }

    chrome.runtime.sendMessage( { message: "limiting_list", index: event_index }, function (response) { 
//        console.log( "Limiting response: " + JSON.stringify( response ) );
//        console.log( "Limiting state: " + response.limitingState );
//        console.log( "Limiting type:  " + response.urlListType );
//        console.log( "Limiting list: " + JSON.stringify( response.rawUrlList ) );
        list_type = response.urlListType;

        switch ( list_type )
        {
            case BLOCK_ALL:
		document.title = chrome.i18n.getMessage("page_blocked_title") + chrome.i18n.getMessage("product_name");
		header.innerHTML = chrome.i18n.getMessage("blocked_website");
		blocked.innerHTML = chrome.i18n.getMessage("all_blocked_header");
                break;
            case BLOCK_SPECIFIC:
		document.title = chrome.i18n.getMessage("page_blocked_title") + chrome.i18n.getMessage("product_name");	
		header.innerHTML = chrome.i18n.getMessage("blocked_website");
		blocked.innerHTML = chrome.i18n.getMessage("page_blocked_header");
                break;
            case ALLOW_SPECIFIC:
		document.title = chrome.i18n.getMessage("page_blocked_available_title") + chrome.i18n.getMessage("product_name");
		header.innerHTML = chrome.i18n.getMessage("available_websites");
                blocked.innerHTML = chrome.i18n.getMessage("page_blocked_header_allowed");
                buildUrlList( response.UrlList );
                break;
            case NO_IP_ADDRESS:
		document.title = chrome.i18n.getMessage("page_blocked_title") + chrome.i18n.getMessage("product_name");	
		header.innerHTML = chrome.i18n.getMessage("blocked_ipaddress");
		blocked.innerHTML = chrome.i18n.getMessage("page_blocked_header");
                break;
            default:
                break;
        }

    } );
        	
}

function buildUrlList( list )
{
    var list_html = "<p id=\"sites\">";
    var allowed = document.getElementById( 'url_text' );
    
    for(var x = 0; x < list.length; x ++  )
    {
        var url = list[x];
        var raw = url;

        console.log( "Adding URL: [" + url + "]" );

        // remove anything that could result in xss attacks.
        url = url.replace(/[<>:]/, '' );			// remove anything invalid characers
        
        // finally htmlencode wildcards with special syntax
        url = url.replace(/\*/, '&#42;' );
        url = url.replace(/\?/, '&#63;' );
        
        // don't provide links for wildcard entries
        if ( raw.indexOf( "?") != -1 || raw.indexOf( "*") != -1 )
        {
            list_html += "<span>" + url + "</span><br>\n";
        }
        else
        {
            list_html += "<a href=\"http://" + url + "\">" + url + "</a><br>\n";
        }

//        console.log( "filtered URL: [" + url + "]" );
    }
    if ( allowed )
        allowed.innerHTML =  "<br>" + list_html;
    
}

document.addEventListener(
	'DOMContentLoaded',
	function()
	{
		main();
	}
);