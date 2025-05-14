class TabMute {

    constructor() {
        this.mutedIds = [];
    }

    logTabAudibleState(tab) {
        console.log("Tab ID " + tab.id + " audible state: " + tab.audible);
        console.log("Tab ID " + tab.id + " muted state: " + JSON.stringify(tab.mutedInfo));
    }

    needsToBeMuted(tab) {
        if (tab.audible === true &&
            tab.hasOwnProperty("mutedInfo") &&
            tab.mutedInfo.muted !== true) {
            return true;
        }
    }

    addMutedTabToArray(tabId) {
        if (!this.mutedIds.includes(tabId)) {
            this.mutedIds.push(tabId);
        }
    }

    muteTab(tab) {
        if (this.needsToBeMuted(tab)) {
            this.addMutedTabToArray(tab.id);
            console.log("Muting tab " + tab.id + " (" + tab.title + ")");
            chrome.tabs.update(tab.id, { 'muted': true }, (tab2) => {
                this.logTabAudibleState(tab2);
            });
        }
    }

    muteTabs() {
        chrome.tabs.query({ 'audible': true }, function (tabs) {
            for (let i = 0; i < tabs.length; i++) {
                this.muteTab(tabs[i]);
            }
        }.bind(this));
    }

    unMuteTab(tabId) {
        console.log("Unmuting tab " + tabId);
        chrome.tabs.update(tabId, { 'muted': false }, (tab2) => {
            this.logTabAudibleState(tab2);
        });
    }

    unMuteTabs() {
        for (let i = 0; i < this.mutedIds.length; i++) {
            this.unMuteTab(this.mutedIds[i]);
        }

        this.mutedIds = [];
    }
}

class PersistTabMuting {
    constructor(tabMute) {
        this.tabMute = tabMute; // Instance of TabMute
        this.persistMutingIntervalId = -1;
    }

    persistTabMuting() {
        this.stopPersistTabMuting();
        this.persistMutingIntervalId = setInterval(function () {
            this.tabMute.muteTabs();
        }.bind(this), 2000);
    }

    stopPersistTabMuting() {
        if (this.persistMutingIntervalId !== -1) {
            clearInterval(this.persistMutingIntervalId);
            this.persistMutingIntervalId = -1;
        }
    }
}
