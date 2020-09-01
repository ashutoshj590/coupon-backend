class HttpError extends Error {
    //HttpCode is the response HTTP Code
    //Resonse is the object, that will go down to the client
    constructor(httpCode, response, ...params) {
        // Pass remaining arguments (including vendor specific ones) to parent constructor
        super(...params);
        this.httpCode = httpCode;
        this.response = response;

        // Maintains proper stack trace for where our error was thrown
        Error.captureStackTrace(this, HttpError);

        // Custom debugging information
        this.date = new Date();
    }
}


module.exports = HttpError;