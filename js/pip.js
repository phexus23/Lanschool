setInterval(() => {
    chrome.runtime.sendMessage({ message: "isBlankScreenEnabled" }, (enabled) => {
        if (!enabled)
            return;

        const videos = Array.from(document.querySelectorAll('video'))
        .filter(video => video.readyState != 0)
        .filter(video => video.disablePictureInPicture == false);

        if (videos.length === 0)
            return;

        chrome.runtime.sendMessage({ message: "log_this_from_content_script", log: "videos.length = " + videos.length });
        document.exitPictureInPicture();
    });
}, 5000);
