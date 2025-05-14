/** Capture visible tab
 * 
 * Originated by Stoneware, Inc.  http://www.stone-ware.com
 *
 * The enclosed material is Stoneware Confidential and is the sole
 * property of Stoneware, Inc.  Unauthorized disclosure, distribution
 * or other use of this material is expressly prohibited.
 *
 * (c) Copyright 1999-2022 Stoneware, Inc.  All rights reserved.
*/


// OK to keep as global for MV3 as it will be reinitialized when gatherActiveTabThumbnail() is called.
var g_canvas = null;

function calculateScale(width, height, newWidth, newHeight) {
    var scale = 1;
    var xscale = newWidth / width;
    var yscale = newHeight / height;

    if (xscale < yscale)
        scale = xscale;
    else
        scale = yscale;

    return scale;
}

function getFormatString(format) {
    var str = "image/jpeg";
    if (format == "PNG") {
        str = "image/png";
    }

    return str;
}

function drawRoundedRect(x, y, width, height, radius, fill, stroke, context) {
    radius = {
        tl: radius,
        tr: radius,
        br: radius,
        bl: radius
    };

    context.beginPath();
    context.moveTo(x + radius.tl, y);
    context.lineTo(x + width - radius.tr, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    context.lineTo(x + width, y + height - radius.br);
    context.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    context.lineTo(x + radius.bl, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    context.lineTo(x, y + radius.tl);
    context.quadraticCurveTo(x, y, x + radius.tl, y);
    context.closePath();

    if (fill) {
        context.fill();
    }
    if (stroke) {
        context.stroke();
    }

    return context;
};

function getTruncatedTextForWidth(textToShorten, context, fitWidth, devicePixelRatio) {
    let finalText = textToShorten;
    let textWidth = context.measureText(finalText).width * devicePixelRatio + 10;
    let n = textToShorten.length;

    while (textWidth > fitWidth && n > 0) {
        finalText = textToShorten.substr(0, --n) + "...";
        textWidth = context.measureText(finalText).width * devicePixelRatio + 10;
    }

    return finalText;
};

function canvasTextOverlay(params) {
    let imageWidth = params.imageWidth;
    let imageHeight = params.imageHeight;
    let message = params.message;
    let context = params.context;
    let fontSizeStart = params.fontSizeStart || 12;
    let orientation = params.orientation;
    let fontWidthPercentageLimit = params.fontWidthPercentageLimit || 0.33;
    let fontCheckIncreaseAmount = params.fontCheckIncreaseAmount || 12;
    let devicePixelRatio = params.devicePixelRatio || 1;

    var metrics = null;
    var boxWidth = 0;
    var boxHeight = 0;
    var offsetFontVertical = 10;

    for (var font = fontSizeStart; font < 144; font += fontCheckIncreaseAmount) {
        context.font = font + "px Arial";
        metrics = context.measureText(message);
        boxWidth = metrics.width * devicePixelRatio + 20;
        boxHeight = font + 12;
        if (boxWidth / imageWidth > fontWidthPercentageLimit)
            break;
    }

    var centerline = imageWidth / 2;
    var boxStartX = centerline - boxWidth / 2;
    var boxStartY = 10;
    if (orientation === "bottom") {
        boxStartY = imageHeight - boxHeight;
    }
    else if (orientation === "center") {
        boxStartY = (imageHeight - boxHeight) / 2;
    }

    if (boxStartX < 0)
        boxStartX = 0;

    if (boxWidth > imageWidth)
        boxWidth = imageWidth;

    let formattedMessage = getTruncatedTextForWidth(message, context, boxWidth, devicePixelRatio);
    if (formattedMessage === "...")
        return context;

    context.globalAlpha = 0.5;
    context.fillStyle = "black";
    context.strokeStyle = "white";

    context = drawRoundedRect(boxStartX, boxStartY, boxWidth, boxHeight, 5, true, true, context);

    context.globalAlpha = 1;
    context.fillStyle = "white";

    if (font < 30)
        offsetFontVertical = 6;

    context.fillText(formattedMessage, boxStartX + 10, offsetFontVertical + boxHeight - (0.25 * font) + boxStartY - 10, boxWidth);

    return context;
};

function readAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onerror = reject;
        fr.onload = () => {
            resolve(fr.result);
        };
        fr.readAsDataURL(file);
    });
}

async function requestTabThumbnail(params) {
    let imageWidth = 0;
    let imageHeight = 0;
    let base64Data = '';

    try {
        const activeTabImage = await gatherActiveTabThumbnail(params);
        imageWidth = activeTabImage.imageWidth;
        imageHeight = activeTabImage.imageHeight;
        base64Data = activeTabImage.base64Data;
    }
    catch (err) {
        console.error('Error gathering active tab thumbnail: ' + err);
    }

    const msgObj = {
        message: params.responseMsg,
        width: imageWidth,
        height: imageHeight,
        base64: base64Data,
        format: params.format,
        webHelperReturnCookie: params.webHelperReturnCookie
    };

    chrome.runtime.sendMessage(params.sender, msgObj);
}

function inject_windowDevicePixelRatio() {
    if (!window) {
        return 1;
    }

    return window.devicePixelRatio;
}

function getDevicePixelRatio(currentTab) {
    return new Promise((resolve, reject) => {
        chrome.scripting.executeScript({
            target: {
                tabId: currentTab.id
            },
            func: inject_windowDevicePixelRatio
        },
            (devicePixelRatio) => {
                if (Array.isArray(devicePixelRatio) &&
                    devicePixelRatio.length >= 1 &&
                    devicePixelRatio[0].hasOwnProperty('result')) {
                    resolve(devicePixelRatio[0].result);
                }
                else {
                    reject('getDevicePixelRatio(): Injected script returned unknown info: ' + JSON.stringify(devicePixelRatio));
                }
            });
    });
}

async function getCurrentTab() {
    const queryOptions = {
        active: true,
        currentWindow: true
    };

    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

async function gatherActiveTabThumbnail(params) {
    var x_offset = 0;
    var y_offset = 0;
    var context = null;

    let imageWidth = 0;
    let imageHeight = 0;

    const currentTab = await getCurrentTab();

    let url = await chrome.tabs.captureVisibleTab();

    if (chrome.runtime.lastError || (typeof url === "undefined")) {
        console.log("Error retrieving visible tab: " + JSON.stringify(chrome.runtime.lastError));
        console.log("url == " + url);
        throw new Error('Error capturing visible tab: ' + chrome.runtime.lastError);
    }

    // console.log(`*** Image URL: ${url}`);
    const imgBlob = await fetch(url)
        .then(r => r.blob());

    imageWidth = (params.width > 0) ? params.width : (currentTab) ? currentTab.width : 0;
    imageHeight = (params.height > 0) ? params.height : (currentTab) ? currentTab.height : 0;

    if (imageWidth < 1 || imageHeight < 1) {
        new Error('Canvas size is invalid.');
    }

    if (!g_canvas)
        g_canvas = new OffscreenCanvas(imageWidth, imageHeight);
    else {
        g_canvas.width = imageWidth;
        g_canvas.height = imageHeight;
    }

    context = g_canvas.getContext('2d');
    const img = await createImageBitmap(imgBlob);

    scale = calculateScale(img.width, img.height, imageWidth, imageHeight);
    var scale_width = Math.round(img.width * scale);
    var scale_height = Math.round(img.height * scale);

    // fill background
    context.fillStyle = "#000000";
    context.fillRect(0, 0, imageWidth, imageHeight);

    if (imageWidth > scale_width)
        x_offset = Math.round((imageWidth - scale_width) / 2);
    if (imageHeight > scale_height)
        y_offset = Math.round((imageHeight - scale_height) / 2);

    context.drawImage(img, x_offset, y_offset, scale_width, scale_height);

    if (params.overlayMessage) {
        let devicePixelRatio = 1;

        try {
            if (currentTab) {
                devicePixelRatio = await getDevicePixelRatio(currentTab);
            }
            else
                throw new Error('No currentTab found.');
        }
        catch (e) {
            console.error('Error gettings device pixel ratio: ' + e);
        }

        context = canvasTextOverlay({
            imageWidth: imageWidth,
            imageHeight: imageHeight,
            message: params.overlayMessage,
            context: context,
            orientation: params.textOverlayPosition || "center",
            fontWidthPercentageLimit: params.fontWidthPercentageLimit || 0.65,
            fontCheckIncreaseAmount: 3,
            devicePixelRatio: devicePixelRatio
        });
    }

    let base64Data = '';
    let imageData;
    if (params.format === 'jpeg') {
        imageData = await g_canvas.convertToBlob({
            type: "image/jpeg",
            quality: 1
        });

        base64Data = await readAsDataURL(imageData);
    }
    else {
        imageData = context.getImageData(0, 0, imageWidth, params.height);
        base64Data = ArrayBufferToBase64Ex(imageData.data);
    }

    return {
        base64Data: base64Data,
        imageWidth: imageWidth,
        imageHeight: imageHeight
    }
}

