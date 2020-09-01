class dbError extends Error {
    //HttpCode is the response HTTP Code
    //Resonse is the object, that will go down to the client
    constructor(dbCode, dbQuery, dbParams, ...params) {
        // Pass remaining arguments (including vendor specific ones) to parent constructor
        super(...params);
        this.dbCode = dbCode;
        this.dbQuery = dbQuery;
        this.dbParams = dbParams;
        // Maintains proper stack trace for where our error was thrown
        Error.captureStackTrace(this, dbError);

        // Custom debugging information
        this.date = new Date();
    }
}

module.exports = dbError;