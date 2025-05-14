/**
 * Originated by Stoneware, Inc.  http://www.stone-ware.com
 *
 * The enclosed material is Stoneware Confidential and is the sole
 * property of Stoneware, Inc.  Unauthorized disclosure, distribution
 * or other use of this material is expressly prohibited.
 *
 * (c) Copyright 1999-2014 Stoneware, Inc.  All rights reserved.
**/

"use strict";

importScripts(
	'base64.js',
	'tabThumbnail.js',
	'ParseURL.js',
	'port.js',
	'tabMute.js',
	'logger.js',
	'blockedPageURL.js'
);

const storageCache = {
	lastUrl: '',
	lastTitle: '',
	lastBlockedUrl: '',
	useXMLHttp: true,
	limitingFlags: 0,
	limitingState: 0,
	urlList: [],
	rawUrlList: [],
	urlListType: 0,
	blockIPAddresses: false,
	blockIncognito: false,
	lastLimitFlags: 0,
	bannedWordList: [],
	keylogQueue: new Array(50),
	keylogQueueIndex: 0,
	bannedWordListSender: "",
	keystrokeInjectionActive: false,
	blockVideoPiP: false,
	currentStudent: '',
	portDead: false,
	portDeadCnt: 0,
	studentConfigData: null,
	studentFullName: '',
	blockEventsList: [],
	blockPage: '',
	blockPageToIgnore: '',
	receivedHeartBeat: false
};

async function setLastUrl(url) {
	storageCache.lastUrl = url;
	await chrome.storage.local.set(storageCache);
}

async function setLastTitle(title) {
	storageCache.lastTitle = title;
	await chrome.storage.local.set(storageCache);
}

async function setLastBlockedUrl(url) {
	storageCache.lastBlockedUrl = url;
	await chrome.storage.local.set(storageCache);
}

async function setPortDead(isDead) {
	storageCache.portDead = isDead;
	await chrome.storage.local.set(storageCache);
}

async function incPortDeadCnt() {
	storageCache.portDeadCnt++;
	await chrome.storage.local.set(storageCache);
}

async function resetPortDeadCnt() {
	storageCache.portDeadCnt = 0;
	storageCache.portDead = false;
	await chrome.storage.local.set(storageCache);
}

async function setUseXMLHttp(useXMLHttp) {
	storageCache.useXMLHttp = useXMLHttp;
	await chrome.storage.local.set(storageCache);
}

async function setLimitingFlags(flags) {
	storageCache.limitingFlags = flags;
	await chrome.storage.local.set(storageCache);
}

async function setLimitingState(state) {
	storageCache.limitingState = state;
	await chrome.storage.local.set(storageCache);
}

async function clearUrlList() {
	storageCache.urlList.length = 0;
	await chrome.storage.local.set(storageCache);
}

async function setUrlListEntryAtIndex(entry, index) {
	if (!entry || index < 0)
		return;

	storageCache.urlList[index] = entry;

	await chrome.storage.local.set(storageCache);
}

async function clearRawUrlList() {
	storageCache.rawUrlList.length = 0;
	await chrome.storage.local.set(storageCache);
}

async function setRawUrlListEntryAtIndex(entry, index) {
	if (!entry || index < 0)
		return;

	storageCache.rawUrlList[index] = entry;

	await chrome.storage.local.set(storageCache);
}

async function setUrlListType(type) {
	storageCache.urlListType = type;
	await chrome.storage.local.set(storageCache);
}

async function setBlockIPAddresses(blockIPAddresses) {
	storageCache.blockIPAddresses = blockIPAddresses;
	await chrome.storage.local.set(storageCache);
}

async function setBlockIncognito(blockIncognito) {
	storageCache.blockIncognito = blockIncognito;
	await chrome.storage.local.set(storageCache);
}

async function setLastLimitFlags(flags) {
	storageCache.lastLimitFlags = flags;
	await chrome.storage.local.set(storageCache);
}

async function setBannedWordList(bannedWordList) {
	if (Array.isArray(bannedWordList)) {
		storageCache.bannedWordList = [];
		for (let i = 0; i < bannedWordList.length; i++) {
			storageCache.bannedWordList.push(bannedWordList[i]);
		}
	}
	else
		storageCache.bannedWordList = bannedWordList;

	await chrome.storage.local.set(storageCache);
}

async function setKeyLogQueueElement(element) {
	storageCache.keylogQueue[storageCache.keylogQueueIndex] = element;
	await chrome.storage.local.set(storageCache);
}

async function setKeyLogQueueIndex(val) {
	storageCache.keylogQueueIndex = val;
	await chrome.storage.local.set(storageCache);
}

async function decrementKeyLogQueueIndex() {
	storageCache.keylogQueueIndex--;
	await chrome.storage.local.set(storageCache);
}

async function incrementKeyLogQueueIndex() {
	storageCache.keylogQueueIndex++;
	await chrome.storage.local.set(storageCache);
}

async function setBannedWordListSender(sender) {
	storageCache.bannedWordListSender = sender;
	await chrome.storage.local.set(storageCache);
}

async function setKeystrokeInjectionActive(active) {
	storageCache.keystrokeInjectionActive = active;
	await chrome.storage.local.set(storageCache);
}

async function setBlockVideoPiP(blockVideoPiP) {
	storageCache.blockVideoPiP = blockVideoPiP;
	await chrome.storage.local.set(storageCache);
}

async function setCurrentStudent(student) {
	storageCache.currentStudent = student;
	await chrome.storage.local.set(storageCache);
}

async function setStudentConfigData(data) {
	storageCache.studentConfigData = data;
	await chrome.storage.local.set(storageCache);
}

async function setStudentFullName(fullName) {
	storageCache.studentFullName = fullName;
	await chrome.storage.local.set(storageCache);
}

async function addToBlockEventsList(element) {
	storageCache.blockEventsList.push(element);
	await chrome.storage.local.set(storageCache);
}

async function setBlockPage(blockPage) {
	storageCache.blockPage = blockPage;
	await chrome.storage.local.set(storageCache);
}

async function setBlockPageToIgnore(blockPageToIgnore) {
	storageCache.blockPageToIgnore = blockPageToIgnore;
	await chrome.storage.local.set(storageCache);
}

async function setReceivedHeartBeat(receivedHeartBeat) {
	storageCache.receivedHeartBeat = receivedHeartBeat;
	await chrome.storage.local.set(storageCache);
}

const limitTimeout = 30; // 20 seconds

const ALLOW_ALL = "0";
const BLOCK_ALL = "1";
const ALLOW_SPECIFIC = "2";
const BLOCK_SPECIFIC = "3";

// limiting flags (selected..)
const DISABLE_WEB_PORT80 = 0x800000E0;
const ALLOW_SPECIFIC_APPS = 0x000800E0;
const DISABLE_SPECIFIC_APPS = 0x001000E0;
const DISABLE_DOTTEDCECIMALS = 0x00400000;
const DISABLE_WEB_CHROME = 0x000001E0;
const ENABLE_TASKMANAGER = 0x000002E0;
const DISABLE_PRIVATE_BROWSE = 0x000004E0;
const DISABLE_TASKMANAGER = 0x000010E0;

var ChromeAppsWhitelist = [
	"cclepbmimdmoahcbccbpbnpfnaakheja", // LanSchool chrome student (unpacked)
	"ifeifkfohlobcbhmlfkenopaimbmnahb", // LanSchool chrome student (release)
	"hgdgmhjbhldlejgpjbphhoegapekcbcc", // LanSchool chrome student (beta channel)
	"bkpmdfhpeipddklkilbhdbiondaopaan",	// LanSchool chrome student (beta 2)
	"hkagldgmfcgclgpffbjplnppjmbgedig",	// LanSchool chrome student (beta 3)
	"glifclcedbcpeplpmnplaekopdgjggcd", // LanSchool chrome student (redist crx)
	"jhiggjblhjhknbhjffjpfoanbghcfmga", // Insight chrome student (release)
	"cdjokdjlmmgodojedmlfppkfnnjnfigf",  // Insight chrome student (beta channel)
	"kmklemnfjbnkliegakkhbbljlmhohcjf",  // Insight chrome student (redist crx)
];

const neverBlock = [
	"chrome-extension://",
	"chrome://",
	"chrome-devtools://",
	"file://"
];

const urlRegexPrefix = '.*[.]{0,1}';

var tabMuter = new TabMute();
var persistTabMuter = new PersistTabMuting(tabMuter);

function TrimTitle(title) {
	if (!title)
		return "";

	title = title.trim();

	if (title.length > 256) {
		title = title.substring(0, 255);
	}

	return title;
}

function TrimUrl(url) {
	if (!url)
		return "";

	if (url.length > 1024) {
		url = url.substring(0, 1023);
	}
	return url;
}

function SanitizeTab(tab, language) {
	if (!tab.active)
		return false;

	if (tab.url.valueOf() == storageCache.lastBlockedUrl.valueOf())
		return false;

	let pageTitle = JSON.stringify(tab.title);
	pageTitle = TrimTitle(pageTitle);
	if (tab.url.valueOf() != storageCache.lastUrl.valueOf() && storageCache.lastTitle.valueOf() != pageTitle.valueOf()) {
		let urlStr = TrimUrl(tab.url);
		return { urlStr: urlStr, pageTitle: pageTitle };
	}

	return false;
}

async function PostHistoryToChromeApp(tab, language) {
	if (!storageCache.receivedHeartBeat)
		return;

	let sanitized = SanitizeTab(tab, language);
	if (sanitized != false) {
		let data = {
			message: "WebURLChanged",
			url: sanitized.urlStr,
			title: sanitized.pageTitle,
			lang: language,
			windowId: tab.windowId
		};

		console.log("WebURLChanged (report_url_change) (**): " + JSON.stringify(data));
		if (storageCache.currentStudent !== "") {
			// tell the chrome student we loaded a new url
			chrome.runtime.sendMessage(storageCache.currentStudent, data, function (response) { });
		}

		await setLastUrl(tab.url);
		await setLastTitle(sanitized.pageTitle);
	}
}

async function PostHistory(tab, language) {
	if (storageCache.useXMLHttp == false)
		return;

	if (storageCache.portDead) {
		await incPortDeadCnt();
		return;
	}

	try {
		if (!tab.active) {
			return;
		}

		if (tab.url.valueOf() == storageCache.lastBlockedUrl.valueOf()) {
			return;
		}

		var pageTitle = JSON.stringify(tab.title);
		pageTitle = TrimTitle(pageTitle);

		if (tab.url.valueOf() != storageCache.lastUrl.valueOf() && storageCache.lastTitle.valueOf() != pageTitle.valueOf()) {
			if (storageCache.useXMLHttp == false) {
				return;
			}

			const urlStr = TrimUrl(tab.url);
			if (!language) {
				language = "en";
			}

			const body = JSON.stringify({ "url": urlStr, "title": pageTitle, "lang": language, "windowId": tab.windowId });

			const fetchUrl = "http://localhost:" + myPort + "/History";
			const fetchStatus = await fetch(fetchUrl, {
				method: 'post',
				headers: {
					"Content-type": "application/json"
				},
				body: body
			})

			if (fetchStatus.ok) {
				console.log('POST to ' + fetchUrl + ' succeeded.');
			}
			else {
				console.error('POST to ' + fetchUrl + ' failed: ' + err);
			}

			await setLastUrl(tab.url);
			await setLastTitle(pageTitle);
		}
	}
	catch (e) {
		console.log("exception in PostHistory: " + e.message + " code " + e.code);

		if (e.code == 19) {
			console.log("network error!");
			await setPortDead(true);
		}
	}

}

function wrapDOM(body) {
	document.head.innerHTML = "";
	document.body.innerHTML = body;
}

// This will be run as a content script so referring to 'document' is OK.
function stopMedia() {
	// case 19293: need to pause all video/audio tags before deleting them or caching trips us up
	var elements = document.getElementsByTagName('video');
	var i;
	for (i = 0; i < elements.length; i++) {
		elements[i].pause();
	}
	elements = document.getElementsByTagName('audio');
	for (i = 0; i < elements.length; i++) {
		elements[i].pause();
	}
}

function fetchStatus(response) {
	if (response.status >= 200 && response.status < 300) {
		return Promise.resolve(response);
	}

	return Promise.reject(new Error(response.statusText));
}

function fetchJSON(response) {
	return response.json();
}

async function PostNewUrl(tab) {
	if (storageCache.useXMLHttp == false)
		return;

	if (storageCache.portDead) {
		await incPortDeadCnt();

		if (storageCache.portDeadCnt > 10) { // reset the port check just in case this was a re-connect
			await resetPortDeadCnt();
			console.log("Reset portDead");
		}
		return;
	}

	if (tab && tab.url && tab.url.substring(0, 9) == "chrome://") {
		return;
	}

	try {
		const fetchUrl = `http://localhost:${myPort}/WebLimit`;
		const urlStr = TrimUrl(tab.url);
		const body = JSON.stringify({ "url": urlStr });

		const response = await fetch(fetchUrl, {
			method: 'post',
			headers: {
				"Content-type": "application/json"
			},
			body: body
		});

		if (!response.ok) {
			console.error("PostNewUrl bad response from server: " + JSON.stringify(err));
			await setPortDead(true);
			return;
		}

		const responseObject = await response.json();

		if (responseObject.block === null) {
			console.error("PostNewUrl failed to get response from server");
			return;
		}

		if (responseObject.block !== "true") {
			console.log("PostNewUrl: site is allowed: " + urlStr);
			if (tab.url === storageCache.lastBlockedUrl) {
				await setLastBlockedUrl('');
			}
			return;
		}

		await setLastBlockedUrl(tab.url);
		if (tab.url.substring(0, 12) == "view-source:") {
			chrome.tabs.remove(tab.id, null);
			console.log("tried to remove the view-source tab!");
			return;
		}

		console.log("PostNewUrl: site is blocked: " + urlStr);

		chrome.scripting.executeScript({
			target: { tabId: tab.id },
			func: stopMedia
		},
			() => {
				if (responseObject.redirectUrl) {
					// redirect to this url
					chrome.tabs.update(tab.id, { url: responseObject.redirectUrl });
				}
				else if (responseObject.redirect) {
					var body = JSON.stringify(responseObject.redirect);

					var pattern = "&quot;";
					var re = new RegExp(pattern, "g");
					body = body.replace(re, "\\\"");

					// TODO: MV3 will not allow a "runAt" like MV2 did. We may or may not need it.
					// Original call for MV2 contained 'runAt: "document_end"' as one of the parameters.
					// https://bugs.chromium.org/p/chromium/issues/detail?id=1303199
					chrome.scripting.insertCSS({
						target: { tabId: tab.id },
						files: ["style.css"]
					}, () => {
						if (chrome.runtime.lastError) {
							// just have to check or Chrome might throw an exception
						}
					});

					chrome.scripting.executeScript({
						target: {
							tabId: tab.id
						},
						func: wrapDOM,
						args: [body]
					},
						() => {
							if (chrome.runtime.lastError) {
								// just have to check or Chrome might throw an exception
							}
						});
				}
			});
	}
	catch (e) {
		console.log("exception in PostNewUrl: " + e.message + " code " + e.code);

		if (e.code == 19) {
			console.log("network error!");
			await setPortDead(true);
		}
	}
}

function postURL_onLoad(e) {

}

function discoverPort() {
	chrome.runtime.getPlatformInfo(async (info) => {
		console.log('operating system: ' + info.os);

		if (info.os === "win") {
			console.log("trying to load file");
			try {
				const theIdent = chrome.runtime.getURL("svrproc42");
				console.log(theIdent);

				fetch(theIdent)
					.then(fetchStatus)
					.then(fetchJSON)
					.then((data) => {
						myPort = data;
					})
					.catch((err) => {
						throw new Error(err);
					});
			}
			catch (err) {
				console.log("discoverPort exception: " + JSON.stringify(err));
			}
		}
		else if (info.os === "cros") {
			// automatically disable xmlhttp if on chromebook
			console.log("Chromebook, disabling XMLHttp!");
			await setUseXMLHttp(false);
			enableChromeStudentListeners();
			reEnableBrowsing();
		}
		else {
			console.log("not windows");
		}
	});
}

async function injectKLCurrentTabs() {
	try {
		const hasLoadedPreviously = await chrome.storage.local.get('webHelperFirstLoad');

		if (hasLoadedPreviously &&
			hasLoadedPreviously.hasOwnProperty('webHelperFirstLoad') &&
			hasLoadedPreviously.webHelperFirstLoad === true) {
			return;
		}

		console.log('Reloading tabs: hasLoadedPreviously: ' + JSON.stringify(hasLoadedPreviously));

		const tabs = await chrome.tabs.query({});

		for (var i = 0; i < tabs.length; i++) {
			if (tabs[i].url.indexOf("chrome-devtools://") == -1 && (tabs[i].url.indexOf("chrome://") == -1)) {
				console.log("reloading tab " + tabs[i].url);
				chrome.tabs.reload(tabs[i].id);
			}
		}

		await chrome.storage.local.set({
			"webHelperFirstLoad": true
		});
	}
	catch (err) {
		console.error('injectKLCurrentTabs() Error:' + err);
	}
}

function handleTabCloseRequest(tabsToClose, callback) {
	if (!tabsToClose)
		return;

	if (!Array.isArray(tabsToClose)) {
		let t = [];
		t.push(tabsToClose);
		tabsToClose = t;
	}

	console.log("Closing tabs: " + JSON.stringify(tabsToClose));

	chrome.tabs.remove(tabsToClose, callback);
}

async function handleExternalMessageFromValidatedId(request, sender, sendResponse) {
	//			console.log( "External message: " + request.message)
	var rv = false;
	switch (request.message) {
		case "BannedWordList":
			{
				//                    console.log("Got BannedWordList message!");
				await setBannedWordList(request.data.bannedWords);
				console.log("Got " + request.data.bannedWords.length + " words.");
				//                    console.log("Got word list: " + JSON.stringify(request.data.bannedWords));
				if (storageCache.bannedWordList.length > 0) {
					if (storageCache.keystrokeInjectionActive == false)
						console.log("BannedWordList: Starting keystroke monitoring.");

					await setKeystrokeInjectionActive(true);
				}
				else {
					if (storageCache.keystrokeInjectionActive == true)
						console.log("BannedWordList: Suspending keystroke monitoring.");

					await setKeystrokeInjectionActive(false);
				}

				injectKLCurrentTabs();
				await setBannedWordListSender(sender.id);
				break;
			}
		case "ExternalLogger":
			{
				logger.setExternalLogger(sender.id);
				break;
			}
		case "KeystrokeAlerting":
			{
				var obj = request.data;
				if (!obj.enabled) {
					if (storageCache.keystrokeInjectionActive == true)
						console.log("KeystrokeAlerting: Suspending keystroke monitoring.");

					await setKeystrokeInjectionActive(false);

				}
				else {
					if (storageCache.keystrokeInjectionActive == false)
						console.log("KeystrokeAlerting: Starting keystroke monitoring.");

					await setKeystrokeInjectionActive(true);
				}
				injectKLCurrentTabs();
				break;
			}
		case "ScrapeStudentName":
			{
				console.log("Got ScrapeStudentName message!");
				if (sendResponse)	// message requested a response?
				{
					sendResponse({ "message": "ACK", "data": "pending" });
				}

				var studentLoginName = "";

				if (request.data) {
					console.log("Parsing " + request.data);
					studentLoginName = request.data.substring(0, request.data.lastIndexOf("@"));
				}

				if (studentLoginName.length == 0) {
					studentLoginName = "unknown";
				}

				console.log("Sending student name as '" + studentLoginName + "'");
				chrome.runtime.sendMessage(sender.id, { message: "StudentNameReply", data: studentLoginName });
				break;
			}
		case "DisableXMLHttp":
			{
				// this is used by the Chrome Student plugin to disable the 
				// default posting of XML requests to the student
				// The Chrome student uses "postMessage()" instead.
				await disableXMLHttp();
				if (storageCache.studentConfigData) {
					//						console.log( "Replying to DisableXMLHttp with AutoConf data: " + studentConfigData );
					if (request.params && request.params.includes("IncludeHost"))	// Flags new response format for LAN-541
						sendResponse({ message: "StudentConfigData", data: storageCache.studentConfigData });
					else
						sendResponse({ message: "StudentConfigData", data: storageCache.studentConfigData.data });

				}
				break;
			}
		case "WebLimitFlagsEx":
			{
				await setBlockPage((request.blockPage != null) ? request.blockPage : "");
				await setBlockPageToIgnore((request.blockPageToIgnore != null) ? request.blockPageToIgnore : "");
				console.log("Web limiting block page is now: '" + storageCache.blockPage + "'");
				console.log("Web limiting block page to ignore is now: '" + storageCache.blockPageToIgnore + "'");
			}
		// No break here. Allow fallthrough.
		case "WebLimitFlags":
			{
				let values = request.value.split("::");
				console.log("WebLimiting flags: " + request.value.toString(16));
				await setLimitingFlags(parseInt(values[0]));
				await setLimitingState(parseInt(values[1]));
				await setLastLimitFlags(Math.round(new Date().getTime() / 1000));
				if ((storageCache.limitingFlags & DISABLE_DOTTEDCECIMALS) == DISABLE_DOTTEDCECIMALS) {
					await setBlockIPAddresses(true);
					console.log("IP Browsing disabled");
				}
				else
					await setBlockIPAddresses(false);

				if ((storageCache.limitingFlags & DISABLE_PRIVATE_BROWSE) == DISABLE_PRIVATE_BROWSE) {
					await setBlockIncognito(true);
					console.log("Incognito Browsing disabled");
				}
				else
					await setBlockIncognito(false);

				await disableXMLHttp();
				break;
			}
		case "WebLimitURLList":
			{
				//console.log( "WebLimiting URLS: " + request.value );
				await disableXMLHttp();
				// the request.value should be json data
				await handleURLList(request.value);
				break;
			}
		case "RunURL":
			{
				console.log("RunURL: " + request.value.url);
				console.log("New tab: " + request.value.newTab);

				handleRunURL(request.value, sendResponse);
				break;
			}
		case "HeartBeat":
			{
				await setCurrentStudent(sender.id);
				await setReceivedHeartBeat(true);
				await disableXMLHttp();
				if (storageCache.studentConfigData) {
					//						console.log("Replying to HeartBeat request.");
					if (request.params && request.params.includes("IncludeHost")) { // Flags new response format for LAN-541
						//							console.log("Replying to HeartBeat (IncludeHost) with AutoConf data: " + studentConfigData);
						sendResponse({ message: "StudentConfigData", data: storageCache.studentConfigData });
					}
					else {
						//							console.log("Replying to HeartBeat () with AutoConf data: " + studentConfigData.data);
						sendResponse({ message: "StudentConfigData", data: storageCache.studentConfigData.data });
					}

				}

				// TODO: we may need to set a status and timer so we can
				// notify the user that the student stopped talking.  
				// That is if we want to put notifications in the browser 
				// toolbar.
				// The heart beat is so that if the WebHelper extension 
				// starts after our main extension, or is re-started it
				// will re-initialize correctly.  -tyler
				break;
			}
		case "CurrentTabsRequest":
			{
				let senderId = sender.id;
				makeTabsRequest()
					.then((tabs) => {
						chrome.runtime.sendMessage(senderId, {
							message: "CurrentTabsResponse",
							data: tabs
						});
					})
					.catch((err) => {
						console.error('Error querying tabs: ' + err);
					});
				break;
			}
		case "CloseTabsRequest":
			{
				handleTabCloseRequest(request.tabs, () => {
					chrome.runtime.sendMessage(sender.id, {
						message: "CloseTabsResponse",
						data: {
							status: "Complete"
						}
					});
				});
				break;
			}
		case "BlankScreenStatus":
			{
				if (request.blankScreenOn !== undefined) {
					console.log("Received BlankScreenStatus: " + request.blankScreenOn);
					await handleBlankScreenNotification(request.blankScreenOn);
				}
				break;
			}
		case "get_screenthumbnail":
			{
				if (sendResponse) {
					sendResponse({ "message": "ACK", "width": 0, "height": 0, "data": "pending" });
					requestTabThumbnail({
						sender: sender.id,
						width: request.width,
						height: request.height,
						format: request.format,
						responseMsg: "thumbnail_response"
					});
				}
				break;
			}
		case "get_screencapture":
			{
				if (sendResponse) {
					sendResponse({ "message": "ACK", "width": 0, "height": 0, "data": "pending" });
					requestTabThumbnail({
						sender: sender.id,
						width: 0,
						height: 0,
						format: request.format,
						responseMsg: "screencap_response",
						overlayMessage: request.overlayMessage,
						textOverlayPosition: "top",
						fontWidthPercentageLimit: 0.33
					});
				}
				break;
			}
		case "get_screenshot":
			{
				if (sendResponse) {
					sendResponse({ "message": "ACK", "width": 0, "height": 0, "data": "pending" });
					var dictionary = {
						sender: sender.id,
						width: request.width,
						height: request.height,
						format: request.format,
						responseMsg: "thumbnail_response",
						overlayMessage: request.overlayMessage
					};

					if (request.hasOwnProperty("webHelperReturnCookie"))
						dictionary.webHelperReturnCookie = request.webHelperReturnCookie;

					requestTabThumbnail(dictionary);
				}
				break;
			}
		default:
			{

			}
	}
}

function makeTabsRequest() {
	return new Promise((resolve) => {
		chrome.tabs.query({}, (tabs) => {
			if (tabs) {
				// Get the current focused window
				chrome.windows.getLastFocused((win) => {
					if (!win || win.focused !== true) {
						// LSA-13131: Didn't get anything back or there isn't a focused window so don't make
						// any tabs active.
						tabs.forEach((tab, index, tabArray) => {
							tabArray[index].active = false;
						});
					}
					else {
						let focusedWindowId = win.id;

						// LSA-13131: The teacher doesn't want active tabs that aren't part of
						// the focused window
						tabs.forEach((tab, index, tabArray) => {
							if (tab.active && tab.windowId !== focusedWindowId) {
								tabArray[index].active = false;
							}
						});
					}

					resolve(tabs);
				});
			}
			else {
				resolve([]);
			}
		});
	});
}

async function handleBlankScreenNotification(screenBlanked) {
	await setBlockVideoPiP(screenBlanked);

	if (screenBlanked) {
		tabMuter.muteTabs();
		persistTabMuter.persistTabMuting();
	}
	else {
		persistTabMuter.stopPersistTabMuting();
		tabMuter.unMuteTabs();
	}
}

function connectListeners() {

	enableIcon(false);
	// NOTE: THE FOLLOWING LISTENERS ARE USED IN THE WINDOWS AND MAC STUDENTS TO CATCH 
	// CHANGES IN THE URL OF AN ACTIVE TAB.  THEY ARE TRIGGERED AFTER THE URL HAS LOADED.
	// TO CONTINUE TO SUPPORT THE CURRENT IMPLEMENTATIONS FOR WINDOWS AND MAC THEY NEED 
	// TO BE HERE BUT BECOME DISABLED WHEN THIS PLUGIN RECEIVES DisableXMLHttp FROM THE
	// STUDENT CHROME PLUGIN.
	//
	//
	discoverPort();

	chrome.tabs.onActivated.addListener(ontabactivated);

	chrome.webNavigation.onCompleted.addListener(navigationOnCompleted);

	chrome.tabs.onUpdated.addListener(tabOnUpdated);

	chrome.windows.onFocusChanged.addListener(onWindowActivated);

	// Handle messages comeing from other plugins (ie: Chrome Student)
	chrome.runtime.onMessageExternal.addListener(
		function (request, sender, sendResponse) {
			isAppInWhitelist(sender.id, async (isValidId) => {
				if (isValidId) {
					await handleExternalMessageFromValidatedId(request, sender, sendResponse);
				}
				else {
					console.log("Rejecting message from " + sender.id + ". (not in whitelist)");
				}
			});
		}
	);

	chrome.runtime.onMessage.addListener(
		async (request, sender, sendRequest) => {
			//			console.log( "Got message: " + request.message );
			if (request.message === "student_config") {
				console.log("CONFIG: " + request.data);
				console.log("HOSTNAME: " + request.hostname);

				await setStudentConfigData(request);
				console.log("currentStudent = '" + storageCache.currentStudent + "'");
				if (storageCache.currentStudent != "") {
					chrome.runtime.sendMessage(storageCache.currentStudent, {
						message: "StudentConfigData",
						data: request.data,
						hostname: request.hostname
					},
						function (response) { });
				}


			}
			else if (request.message === "student_name") {
				console.log("Student name: " + request.data.name + ", sender id: " + request.data.sender);
				if (request.data != null && request.data.sender != null && request.data.name != null) {
					await setStudentFullName(request.data.name);
					chrome.runtime.sendMessage(request.data.sender, { message: "StudentNameReply", data: storageCache.studentFullName });
				}

			}
			else if (request.message === "kl") {
				//console.log("Keylog: " + request.data);
				await toKeylogQueue(request.data);
			}
			else if (request.message === "limiting_list") {
				console.log("Got limiting_info message. Looking for event index " + request.index);
				let blockEvent = {};
				for (let x = 0; x < storageCache.blockEventsList.length; x++) {
					if (storageCache.blockEventsList[x].id === request.index) {
						blockEvent = storageCache.blockEventsList[x];
					}
				}

				sendRequest({
					limitingState: storageCache.limitingState,
					UrlList: storageCache.rawUrlList,
					urlListType: parseInt(storageCache.urlListType),
					blockedUrl: blockEvent.url
				});
			}
			else if (request.message === "isBlankScreenEnabled") {
				sendRequest(storageCache.blockVideoPiP);
			}
			else if (request.message === "log_this_from_content_script") {
				if (request.log)
					console.log(request.log);
			}
		}
	);

	chrome.tabs.onUpdated.addListener(
		function (tab) {
			//                console.log( "Tab updated: " + tab.id );
			chrome.action.disable(tab.id);
		}
	);


} // end connectListeners()

async function toKeylogQueue(data) {
	if (!storageCache.keystrokeInjectionActive || data.alt || data.ctrl || data.shift)	// ignore
		return;

	if (data.length > 1) {
		if (data == "Backspace")
			await decrementKeyLogQueueIndex();

		return;
	}

	data = data.toLowerCase();

	if (storageCache.keylogQueueIndex < 0)
		await setKeyLogQueueIndex(storageCache.keylogQueue.length + storageCache.keylogQueueIndex);

	if (storageCache.keylogQueueIndex >= storageCache.keylogQueue.length)
		await setKeyLogQueueIndex(0);

	await setKeyLogQueueElement(data);
	//console.log(JSON.stringify(keylogQueue));
	for (let i = 0; i < storageCache.bannedWordList.length; i++) {
		let checkWord = storageCache.bannedWordList[i];

		let checkIndex = 0;
		let startCheck = storageCache.keylogQueueIndex - checkWord.length + 1;
		if (startCheck < 0)
			startCheck += storageCache.keylogQueue.length;

		let checkStop = (startCheck + checkWord.length) % storageCache.keylogQueue.length;

		let found = true;
		//console.log("starting check against '" + checkWord + "'");
		for (let j = startCheck; j % storageCache.keylogQueue.length != checkStop && storageCache.keylogQueue; j++) {
			//console.log("j = " + j + ", keylogQueue.length = " + keylogQueue.length);
			//console.log("Checking '" + keylogQueue[j % keylogQueue.length] + "' against '" + checkWord.charAt(checkIndex) + "'");
			if (storageCache.keylogQueue[j % storageCache.keylogQueue.length] != checkWord.charAt(checkIndex++)) {
				found = false;
				break;
			}
		}

		if (found) {
			console.log("Found a word: " + checkWord);
			chrome.runtime.sendMessage(storageCache.bannedWordListSender, { message: "BannedWordTyped", data: checkWord });
		}
	}

	await incrementKeyLogQueueIndex();
}

function buildUrlFromUrlObjectAndSearchParams(urlObj, searchParams) {
	let retString = urlObj.protocol + "//" + urlObj.hostname;
	if (urlObj.port) {
		retString += ":" + urlObj.port;
	}

	retString += urlObj.pathname;
	if (searchParams) {
		retString += "?" + searchParams.toString();
	}

	return retString;
}

function setupBlockPage(attempted, blockPage) {
	const bpurl = new BlockedPageURL()
		.setURL(blockPage)
		.setURLLimit(2047)
		.setLastParameter('limitedby')
		.setParam('attempted', attempted)
		.setParamLengthLimit('attempted', {
			lengthLimit: 80,
			useEllipses: true
		})
		.setParamLengthLimit('limitedby', {
			lengthLimit: 120,
			useEllipses: true
		});

	return bpurl.getURL();
}

function enableChromeStudentListeners() {
	console.log("Enabling Chrome student listener");
	/** 
	 * This listener is different than those above, instead of operating on the 
	 * changes in a tab, this affects any request before it is sent.  This *should* 
	 * be more efficient for filtering.  -tyler
	 * 
	 * NOTE: this filter is only activated after the plugin receives a "heartbeat" message
	 * from the Chrome student.
	 **/

	chrome.webRequest.onBeforeRequest.addListener(
		(info) => {
			// This callback contains calls to several functions which are meant to be called with "await" 
			// (setLastBlockedUrl(), addToBlockEventsList()). However, when blocking a page, this 
			// function should also return a "redirectUrl", which actually becomes returning a Promise if  
			// the callback is async, thereby preventing Chrome from taking any action. Instead, we'll run the very
			// small risk of not awaiting on the aforementioned functions.

			// if no messages from a chrome student, don't bother filtering here
			if (!storageCache.receivedHeartBeat)
				return;

			// never block certain urls
			if (isNeverBlocked(info.url))
				return;

			let blocked = false;
			//console.log( "Caught web request for: " + info.url + "(" + info.type + ")" );

			switch (info.type) {
				case "sub_frame":
				case "main_frame":
					//case "xmlhttprequest":
					{
						// here we'll only handle requests for the main frame and/or 
						// sub-frames.  We really don't need to filter out page objects
						// like style sheets, scripts etc.

						// This gets the URL of the "blocked.html" page fromt the extension 
						// instead of passing it in.
						let blockedUrl = "";
						if (storageCache.blockPage && storageCache.blockPage.length > 0)
							blockedUrl = storageCache.blockPage;
						else
							blockedUrl = chrome.runtime.getURL("blocked.html");

						if (info.url.indexOf(blockedUrl) > -1)  // ignore our own "blocked" url
							break;

						if (storageCache.urlListType != 0) {
							let safe_url = escape(info.url);
							let safe_sites = "";
							let action = "blocked";
							let u = parseURLex(info.url);
							let reason = "";

							//					console.log( "Filtering request for: (" +info.type + "): [" + u.url + "]");
							if (storageCache.blockIPAddresses && u.isIP) {
								blocked = true;
								action = "noip";
							}
							else {

								switch (storageCache.urlListType) {
									case BLOCK_ALL:
										{
											blocked = true;
											reason = "Web disabled";
											break;
										}
									case ALLOW_SPECIFIC:
										{
											blocked = !isURLInBlockedList(info.url);
											action = "allowed";
											if (blocked) {
												//									console.log( "Allowing specific web sites" );
												for (let x = 0; x < storageCache.urlList.length; x++) {
													if (x > 0)
														safe_sites += ",";
													safe_sites += storageCache.rawUrlList[x];
												}
												setLastBlockedUrl(info.url);
												reason = "Page not in allowed list";
											}
											break;
										}
									case BLOCK_SPECIFIC:
										{
											blocked = isURLInBlockedList(info.url);
											if (blocked) {
												setLastBlockedUrl(info.url);
												reason = "Page in blocked list";
											}
											break;
										}

								}
							}
							if (blocked) {
								console.log("Blocking page: [" + info.url + "] (" + reason + ")");
								let timestamp = timeStamp();
								addToBlockEventsList({
									id: timestamp,
									url: info.url
								});

								if (storageCache.blockPage && storageCache.blockPage.length > 0) {
									let redirectPage = setupBlockPage(info.url, storageCache.blockPage);
									return { redirectUrl: redirectPage };
								}

								return { redirectUrl: chrome.runtime.getURL("blocked.html?index=" + timestamp) }
							}
						}
						break;
					}
				case "stylesheet":
				case "script":
				case "image":
				case "object":
				case "other":
					{
						// warning: this can get pretty noisy
						// console.log( "Ignored request for: (" +info.type + ") :" + info.url );
						break;
					}

			}

		},
		{ urls: ["<all_urls>"] },
		["blocking"]);

	setInterval(checkLimitingTimeout, 20000);
}

/** 
 * Check to see if we're in web limiting mode.  If so, and the last time we received
 * a web limiting flags message was more than 20 seconds ago, disable our web limiting
 * 
 **/
function checkLimitingTimeout() {
	if (storageCache.lastLimitFlags === 0 || (storageCache.urlListType === 0))
		return;

	let tm_now = Math.round(new Date().getTime() / 1000);
	if (tm_now > (storageCache.lastLimitFlags + limitTimeout)) {
		console.log("It's been a while since we've received a status from the teacher.  Disabling web limiting.");
		reEnableBrowsing();
	}
}


/**
 * Disables the XMLHTTP post methods and listeners attached.
 * Those methods are typically used by external services from the 
 * Windows and Mac students.  If we recieve a message through the plugin
 * we're most likely running a chrome student so those other listeners are
 * just noise.
 **/
async function disableXMLHttp() {
	if (storageCache.useXMLHttp == true) {
		console.log("Disabling XMLHttp methods and listeners");
		await setUseXMLHttp(false);

		// also disable the listeners for the tab change events
		chrome.tabs.onActivated.removeListener(ontabactivated);
		//chrome.webNavigation.onCompleted.removeListener(navigationOnCompleted);
		chrome.tabs.onUpdated.removeListener(tabOnUpdated);

		chrome.windows.onFocusChanged.removeListener(onWindowActivated);

		reEnableBrowsing();
		enableChromeStudentListeners();
	}
}

async function checkTabs(tabs) {
	for (let tab of tabs) {
		if (tab && tab.url) {
			console.log("checking " + tab.url);
			await PostNewUrl(tab);
		}
	}
}

function onWindowActivated(windowId) {
	console.log("Newly focused window: " + windowId);
	chrome.tabs.query({ currentWindow: true, active: true }, async (tabs) => {
		await checkTabs(tabs);
	});
}

function ontabactivated(activeInfo) {
	if (activeInfo && activeInfo.tabId && activeInfo.tabId > 0) {
		chrome.tabs.get(activeInfo.tabId, async (tab) => {
			if (chrome.runtime.lastError || !tab)
				return;

			if (tab.url) {
				//				console.log("onActivated: " + tab.url);
				await PostNewUrl(tab);
				if (storageCache.portDead) {
					console.log(`RETRY ${myPort}`);
					// TODO: Make async??
					discoverPort();
					console.log(`RETRY ${myPort}`);
					await setPortDead(false);
					await PostNewUrl(tab);
				}
			}
		});
	}
}

/**
 * Called when a window or tab completes a navigation task
 **/
function navigationOnCompleted(details) {
	if (details && details.tabId && details.url && details.tabId > 0) {
		chrome.tabs.get(details.tabId, function (tab) {
			if (chrome.runtime.lastError) {
				console.log("chrome.tabs.get() error: " + chrome.runtime.lastError.message);
				return;
			}
			if (tab && tab.url) {
				//				if ( useXMLHttp == false )
				//				{
				//					detectStudentConfig();
				//				}

				chrome.tabs.detectLanguage(tab.tabId, async function (language) {
					//				   	console.log("webNavigation.onCompleted: " + tab.url);
					//                     if (currentStudent !== "") {
					//                         chrome.runtime.sendMessage( currentStudent, {
					//                                 message: "WebURLChanged",
					//                                 url: tab.url,
					//                                 title: tab.title,
					//                                 lang: language,
					//                                 windowId: tab.tabId },
					//                             function (response) { } );
					//                     }
					await PostHistory(tab, language);
					PostHistoryToChromeApp(tab, language);
				});
			}
		});
	}
}

/** 
 * Called when a tab is updated 
 **/
function tabOnUpdated(tabId, changeInfo, tab) {
	if (tabId && tabId > 0) {
		chrome.tabs.get(tabId, async (tab) => {
			if (tab && tab.url) {
				//				console.log("onUpdated: " + tab.url);
				await PostNewUrl(tab);
				if (storageCache.portDead) {
					console.log(`RETRY ${myPort}`);
					// TODO: Make async??
					discoverPort();
					console.log(`RETRY ${myPort}`);
					await setPortDead(false);
					await PostNewUrl(tab);
				}
			}
		});
	}
}

function detectStudentConfig() {
	console.log("Detecting Student configuration data");

}

async function reEnableBrowsing() {
	await setUrlListType(0);
	await setBlockIPAddresses(false);
	await setBlockIncognito(false);
	updateWebLimitingIcon(false);
}

/**
 *  build the list of URL's to be blocked or permitted depending on the 
 *  list type.
 *  @Param list - expects a string list of urls in json format.
 **/
async function handleURLList(list) {
	let urls = JSON.parse(list);

	// clear the current list
	await clearUrlList();
	await clearRawUrlList();

	// List type should have been already set but check it here
	await setUrlListType(urls.listType);

	if (storageCache.urlListType == 0) {
		await reEnableBrowsing();
	}
	else {
		updateWebLimitingIcon(true);
	}

	//	console.log( "Updating URL List with " + urls.entries.length );
	if (urls.entries && urls.entries.length > 0) {
		// convert wildcard syntax to regex
		for (let x = 0; x < urls.entries.length; x++) {
			let indx = 0;
			await setRawUrlListEntryAtIndex(urls.entries[x], x);
			let entry = urls.entries[x];
			entry = entry.replace(/[.]/g, "[.]");
			entry = entry.replace(/\*/g, ".*");
			entry = entry.replace(/\?/g, ".");
			entry = entry.replace(/\//g, "[/]");
			indx = entry.search(/\.\*/);

			if (indx === 0)
				await setUrlListEntryAtIndex(new RegExp(entry, "i"), x);
			else
				await setUrlListEntryAtIndex(new RegExp(urlRegexPrefix + entry, "i"), x);	// prepend wildcard for subdomains like "www" that may have been stripped by the teacher

			//			console.log( "REGEX: [" + entry + "]" );
		}
		//urlList = urls.entries;
	}

	// Now that the URL list is ready, scan the current open tabs for anything that needs to be blocked
	validateCurrentTabs();

}

function updateWebLimitingIcon(bLimiting) {
	if (storageCache.useXMLHttp == false) {
		if (bLimiting) {
			// show the web limiting icon and message
			chrome.action.setIcon({
				path: "/disableweb.png"
			});

			chrome.action.setTitle({
				title: chrome.i18n.getMessage("web_limited")
			});
		}
		else {
			// reset the normal icon
			chrome.action.setIcon({
				path: "/icon16.png"
			});

			chrome.action.setPopup({
				popup: ""
			});

			chrome.action.setTitle({
				title: ""
			});
		}
	}
}

/**
 * Loop through every available tab to see if the url for that tab needs to be blocked.
 * If it does, reset it's url.  If it's incognito, and that's been blocked, close it.
 **/
function validateCurrentTabs() {
	let blocked = false;
	let safe_sites = "";

	chrome.tabs.query({}, async (tabs) => {
		for (var i = 0; i < tabs.length; i++) {
			safe_sites = "";
			//			console.log( "TAB: " + tabs[i].url );
			if (isNeverBlocked(tabs[i].url))
				continue;

			let u = parseURLex(tabs[i].url);
			let safe_url = escape(tabs[i].url);

			let timestamp = timeStamp();
			await addToBlockEventsList({
				id: timestamp,
				url: tabs[i].url
			});

			if (storageCache.blockIPAddresses && u.isIP) {
				if (storageCache.blockPage && storageCache.blockPage.length > 0) {
					let redirectPage = setupBlockPage(tabs[i].url, storageCache.blockPage)
					chrome.tabs.update(tabs[i].id, { url: redirectPage });
				}
				else
					chrome.tabs.update(tabs[i].id, { url: chrome.runtime.getURL("blocked.html?index=" + timestamp /*?action=blocked&url=" + safe_url + "&sites="*/) });

				continue;
			}

			if (tabs[i].incognito && storageCache.blockIncognito) {
				chrome.tabs.remove(tabs[i].id);
				continue;
			}

			switch (storageCache.urlListType) {
				case BLOCK_ALL:
					{
						blocked = true;
						if (storageCache.blockPage && storageCache.blockPage.length > 0) {
							let redirectPage = setupBlockPage(tabs[i].url, storageCache.blockPage)
							chrome.tabs.update(tabs[i].id, { url: redirectPage });
						}
						else
							chrome.tabs.update(tabs[i].id, { url: chrome.runtime.getURL("blocked.html?index=" + timestamp /* ?action=blocked&url=" + safe_url + "&sites="*/) });

						break;
					}
				case ALLOW_SPECIFIC:
					{
						blocked = tabs[i].url && tabs[i].url.length > 0 && !isURLInBlockedList(tabs[i].url);

						if (blocked) {
							//						for ( var x = 0; x < urlList.length; x ++ )
							//						{
							//							if ( x > 0 )
							//								safe_sites += ",";
							//							safe_sites += rawUrlList[x];
							//						}
							//						lastBlockedUrl = tabs[i].url;
							if (storageCache.blockPage && storageCache.blockPage.length > 0) {
								let redirectPage = setupBlockPage(tabs[i].url, storageCache.blockPage)
								chrome.tabs.update(tabs[i].id, { url: redirectPage });
							}
							else
								chrome.tabs.update(tabs[i].id, { url: chrome.runtime.getURL("blocked.html?index=" + timestamp /*?action=allowed&url=" + safe_url + "&sites=" + escape(safe_sites) */) });
						}
						break;
					}
				case BLOCK_SPECIFIC:
					{
						blocked = isURLInBlockedList(tabs[i].url);
						if (blocked) {
							await setLastBlockedUrl(tabs[i].url);
							if (storageCache.blockPage && storageCache.blockPage.length > 0) {
								let redirectPage = setupBlockPage(tabs[i].url, storageCache.blockPage)
								chrome.tabs.update(tabs[i].id, { url: redirectPage });
							}
							else
								chrome.tabs.update(tabs[i].id, { url: chrome.runtime.getURL("blocked.html?index=" + timestamp /*?action=blocked&url=" + safe_url + "&sites="*/) });
						}
						break;
					}

			}


		}
	});


}

function enableIcon(bEnable) {
	console.log("Setting icon to: " + bEnable);
	chrome.tabs.query({}, function (tabs) {

		for (var x = 0; x < tabs.length; x++) {
			chrome.action.disable(tabs[x].id);
		}

	});
}

function timeStamp() {
	return new Date().getTime();
}

function isAppInWhitelist(app, callback) {
	var cnt = ChromeAppsWhitelist.length;

	for (var x = 0; x < cnt; x++) {
		if (ChromeAppsWhitelist[x] === app) {
			callback(true);
			return;
		}
	}

	callback(false);
}

/**
 * receives a URL request from the teacher (via the student plugin) and
 * opens that URL in the current tab.
 **/
function handleRunURL(urlinfo, sendResponse) {
	var new_url = urlinfo.url;
	var spawnNewTab = urlinfo.newTab;
	var teacher = urlinfo.teacher;
	var flags = urlinfo.flags;
	if (typeof spawnNewTab === 'undefined' ||
		spawnNewTab === null)
		spawnNewTab = true;

	console.log("Received RunURL from teacher: " + teacher + " URL: [" + new_url + "]");

	chrome.tabs.query({}, function (tabs) {
		//				console.log("Listing available tabs:");

		if (spawnNewTab && tabs.length > 0) {
			chrome.tabs.create({ url: new_url });
			sendResponse({ message: "OK", data: "" });
			return true;
		}
		else if (!spawnNewTab) {
			for (var x = 0; x < tabs.length; x++) {
				//					console.log("Tab id: " + tabs[x].id);
				if (tabs[x].selected) {
					chrome.tabs.update(tabs[x].id, { url: new_url });
					//						console.log("URL handled");
					sendResponse({ message: "OK", data: "" });
					return true;
				}
			}
		}
		// if we get here, we were unable to open a tab
		if (chrome.windows.create({ url: new_url }) != null)
			sendResponse({ message: "OK", data: "" });
		else
			sendResponse({ message: "no_tab", data: "unable to open tab" });

		//console.log( "URL not handled" );
	});


	return false;
}

/**
 * takes a url and returns true if it is matched in the list of blocked URLs
 **/
function isURLInBlockedList(url) {
	let rv = false;
	let cnt = storageCache.urlList.length;
	const myURL = new URL(url);

	console.log('isURLInBlockedList(): ' + url);
	const sanitizedURL = myURL.protocol + '//' + myURL.host + myURL.pathname + myURL.search + myURL.hash;

	for (let x = 0; x < cnt; x++) {
		console.debug('matching \'' + sanitizedURL + '\' against regex ' + storageCache.urlList[x]);
		if (sanitizedURL.match(storageCache.urlList[x])) {
			rv = true;
			break;
		}
	}

	return rv;
}

/**
 * See if the given URL is in the list of URLS NEVER to be blocked
 **/
function isNeverBlocked(url) {
	var cnt = neverBlock.length;

	for (var x = 0; x < cnt; x++) {
		if (url.match(neverBlock[x])) {
			return true;
		}
	}

	if (storageCache.blockPageToIgnore &&
		storageCache.blockPageToIgnore.length > 0 &&
		url.match(storageCache.blockPageToIgnore))
		return true;

	return false;
}

/** 
 * Check existing tabs for the autoconfig meta data
 * (sometimes, "home" pages will load before our extension is loaded, 
 * this will allow us to handle autoconfig data even it it's loaded before we are)
 **/
function checkCurrentTabsForConfig() {
	chrome.tabs.query({}, function (tabs) {
		for (var i = 0; i < tabs.length; i++) {
			if ((tabs[i].url.indexOf("chrome-devtools://") == -1) &&
				(tabs[i].url.indexOf("chrome://") == -1)) {
				console.log("Inspecting tab for autoconf metatag: " + tabs[i].url);
				chrome.scripting.executeScript({
					target: { tabId: tabs[i].id },
					files: ["js/configstudent.js"],
				},
					() => {
						if (chrome.runtime.lastError)
							console.error("Script not executed: " + chrome.runtime.lastError.message);
					});
			}
		}
	});
}

chrome.commands.onCommand.addListener(function (command) {
	chrome.runtime.getPlatformInfo(function (info) {
		if (info.os != "cros" && command == "check-state") {
			console.log("check-state received");

			chrome.tabs.query({}, async (tabs) => {
				await checkTabs(tabs);
			});
		}
	});
});


/** MAIN **/
(async () => {
	logger.logMessage("Starting...");

	try {
		let items = await chrome.storage.local.get();
		Object.assign(storageCache, items);
	}
	catch (e) {
		console.log(`Error getting local storage: ${e?.message}`);
	}

	connectListeners();

	checkCurrentTabsForConfig();
})();

