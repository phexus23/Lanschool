class ValidateAppFromServer {
    constructor(params) {
        if (params.hasOwnProperty("validationUrl") && params.validationUrl.length > 0) {
            this.url = params.validationUrl;
            if (!this.url.endsWith("/")) {
                this.url += "/";
            }
            
            this.url += params.appId;
        }
        else if (params.hasOwnProperty("apiServer") && params.apiServer.length > 0) {
            this.url = params.apiServer;
            if (!this.url.endsWith("/")) {
                this.url += "/";
            }

            this.url += "0/lsa/lanschool/clientInstaller/chrome/" + params.appId + "/validate";
        }
    }

    async checkApp() {
        let self = this;
        let myUrl = new URL(self.url);
        let response = await fetch(myUrl, {
            headers: {
                "Content-type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(response.status);
        }

        return { valid: true };
    }
}