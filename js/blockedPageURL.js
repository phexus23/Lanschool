class BlockedPageURL {
    constructor() {
        this.paramNameAttempted = 'attempted';
        this.paramNameU = 'u';
        this.url = null;
        this.urlSearchParams = null;
        this.ellipses = encodeURIComponent('...');
        this.paramRestrictions = [];
        this.maxURLLength = -1;
        this.lastParameter = '';
        this.unsafeStrings = [
            /localhost/,        // "localhost"
            /127\.0\.0\.1/,     // "127.0.0.1"
            /.*:\/\//,          // "http://" or "https://" or <anything>://
            /\/\*/              // "/*"
        ];
    }

    setURL(_urlString) {
        this.url = new URL(_urlString);
        this.urlSearchParams = this.url.searchParams;
        this.paramsObj = {};
        return this;
    }

    setParamLengthLimit(paramName, options) {
        this.paramRestrictions.push({
            paramName: paramName,
            options: options
        });
        return this;
    }

    setURLLimit(length) {
        this.maxURLLength = length;
        return this;
    }

    setLastParameter(paramName) {
        this.lastParameter = paramName;
        return this;
    }

    _enforceParamLengthLimit(paramName, options) {
        let param = this.getParam(paramName) || '';
        let paramEncoded = encodeURIComponent(param);

        let lengthLimit = paramEncoded.length;
        let addEllipses = false;

        if (options.hasOwnProperty('lengthLimit')) {
            lengthLimit = options.lengthLimit;
        }

        if (options.hasOwnProperty('useEllipses')) {
            addEllipses = options.useEllipses;
        }

        if (lengthLimit >= paramEncoded.length) {
            // Nothing to do
            return;
        }

        if (addEllipses === true && lengthLimit > this.ellipses.length) {
            if (paramEncoded.length < lengthLimit - this.ellipses.length) {
                addEllipses = false;
            }
            else {
                lengthLimit -= this.ellipses.length;
            }
        }
        else {
            addEllipses = false;
        }

        paramEncoded = '';
        for (let i = 0; i < param.length; i++) {
            const temp = encodeURIComponent(param.substring(i, i + 1));
            const origParamEncoded = paramEncoded;
            paramEncoded += temp;
            if (paramEncoded.length > lengthLimit) {
                paramEncoded = origParamEncoded;
                break;
            }
        }

        if (addEllipses) {
            paramEncoded += this.ellipses;
        }

        param = decodeURIComponent(paramEncoded);
        this.urlSearchParams.set(paramName, param);
    }

    _getUParamArray() {
        let uParam = this.getParam(this.paramNameU);
        if (!uParam) {
            return null;
        }

        return uParam.split(',');
    }

    _enforceMaxURLLength() {
        const encodedURL = encodeURI(this.url);
        if (this.maxURLLength === -1 ||
            encodedURL.length <= this.maxURLLength) {
            return;
        }

        // URL is longer than it should be. Start pulling off 'u' parameters
        const uParamArray = this._getUParamArray();
        if (!uParamArray || uParamArray.length === 0) {
            return;
        }

        let uParamSerialized = '';
        for (let i = 0; i < uParamArray.length; i++) {
            const uParamSerializedOrig = uParamSerialized;

            if (uParamSerializedOrig.length > 0) {
                uParamSerialized += ',';
            }

            uParamSerialized += uParamArray[i];

            const encodedSerialized = encodeURI(uParamSerialized)
            this.urlSearchParams.set(this.paramNameU, encodedSerialized);
            const urlTest = this.url.toString();
            if (urlTest.length > this.maxURLLength) {
                uParamSerialized = uParamSerializedOrig;
            }
        }

        this.urlSearchParams.set(this.paramNameU, uParamSerialized);
    }

    _enforceLastParameter() {
        const paramVal = this.getParam(this.lastParameter);
        if (paramVal) {
            this.urlSearchParams.delete(this.lastParameter);
            this.urlSearchParams.append(this.lastParameter, paramVal);
        }
    }

    _sanitizeParameters() {
        for (const [key, value] of this.urlSearchParams.entries()) {
            let paramVal = value;

            for (const re of this.unsafeStrings) {
                paramVal = paramVal.replace(re, '');
            }

            this.urlSearchParams.set(key, paramVal);
        }
    }

    getParam(paramName) {
        if (!this.url || !this.urlSearchParams) {
            return undefined;
        }

        return this.urlSearchParams.get(paramName);
    }

    setParam(paramName, value) {
        this.urlSearchParams.set(paramName, value);
        return this;
    }

    _removeAttemptedIfLocalhost() {
        const attemptedVal = this.getParam(this.paramNameAttempted);
        if (!attemptedVal) {
            return;
        }

        const attemptedURL = new URL(attemptedVal);
        if (attemptedURL.hostname === 'localhost' ||
            attemptedURL.hostname === '127.0.0.1') {
            this.urlSearchParams.delete(this.paramNameAttempted);
        }
    }

    getURL() {
        try {
            this._removeAttemptedIfLocalhost();
        }
        catch (err) { }

        this._sanitizeParameters();

        for (let i = 0; i < this.paramRestrictions.length; i++) {
            this._enforceParamLengthLimit(this.paramRestrictions[i].paramName, this.paramRestrictions[i].options);
        }

        this._enforceMaxURLLength();

        this._enforceLastParameter();

        return this.url.toString();
    }
}

if (typeof exports !== 'undefined') {
    exports.BlockedPageURL = BlockedPageURL;
}
