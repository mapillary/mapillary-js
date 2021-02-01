export const virtualModules = {
    './getXMLHttpRequest': `
    export default function getXMLHttpRequest() {
        return new XmlHTTPRequest();
    }`,
    'domain': 'export default undefined;',
};

export const resolveOptions = { preferBuiltins: false };
