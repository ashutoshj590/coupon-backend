module.exports = {
    INVALID_JSON: 'Inavlid json body in request',
    MISSING_PARAM: (param) => {
        return `${param} is a required param, Bad request`
    },
    UNATHORIZED: 'Unauthorised Request',
    FBUNATHORIZED: 'Unauthorised Request, Token is invalid'
}