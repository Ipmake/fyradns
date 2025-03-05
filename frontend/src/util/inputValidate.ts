export function validateRecordName(name: string) {
    // May not be empty, may not be longer than 253 characters. Must be a valid domain name.
    if(name.length === 0 || name.length > 253) return false;
    if(name.startsWith("*")) return true;
    const domainRegex = new RegExp('^(?!-)(?!.*--)[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$');
    return domainRegex.test(name);
}

export function validateAContent(content: string) {
    const ipRegex = new RegExp('^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]).){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$');
    return ipRegex.test(content);
}

export function validateAAAAContent(content: string) {
    const ipRegex = new RegExp('(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]).){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]).){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))');
    return ipRegex.test(content);
}

export function validateCNAMEContent(content: string) {
    const domainRegex = new RegExp('^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$');
    return domainRegex.test(content);
}

export function validateMXContent(content: string) {
    const mxRegex = new RegExp('^[0-9]+ .*$');
    return mxRegex.test(content);
}

export function validateNSContent(content: string) {
    const nsRegex = new RegExp('^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$');
    return nsRegex.test(content);
}

export function validatePTRContent(content: string) {
    const ptrRegex = new RegExp('^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$');
    return ptrRegex.test(content);
}

export function validateSOAContent(content: string) {
    return content !== ""
}

export function validateSRVContent(content: string) {
    return content !== ""
}

export function validateTXTContent(content: string) {
    return content !== "";
}