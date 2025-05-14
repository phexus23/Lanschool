
var fullNameClass = document.getElementsByClassName("gb_bc");
var data = null;

if (fullNameClass) {
    if (fullNameClass instanceof HTMLCollection && fullNameClass.length > 0) {
        data = fullNameClass[0].innerText;
        chrome.runtime.sendMessage({message: "student_name", data: {name: data, sender: chooserParam}});
    }
}

