module.exports = {
    /**
     * gets default db driver from sails
     */
    GetDefaultDriver: function(){
        return sails.getDatastore().driver;
    },

    /**
     * get a db connection from the default db driver
     * @async
     */
    GetDBConnection: async function(){
        try{
            var dbdriver = module.exports.GetDefaultDriver();
            var dbmanager = sails.getDatastore().manager;
            var dbcon = await dbdriver.getConnection({manager: dbmanager});
            return dbcon;
        }
        catch(err){
            console.log("DBHelper error: " + err);
            throw err;
        }
    },

    /**
     * performs an async function as a transaction. usage: PerformTransaction(async function(dbcon){ ... });
     * @async
     * @param {async function} fn 
     */
    PerformTransaction: async function(fn){
        sails.getDatastore().transaction(fn);
    }, 

    /**
     * will start a transaction on a connection. the connection is returned to be used for executing queries
     * @async
     */
    StartTransaction: async function(){
        var dbdriver = module.exports.GetDefaultDriver();
        var dbcon = await module.exports.GetDBConnection();
        await dbdriver.beginTransaction(dbcon);
        return dbcon;
    }, 

    /**
     * commit a transaction done in a connection. 
     * Make sure to use the object in connection attribute from the object returned from StartTransaction()
     * @async
     * @param {dbconnection} dbcon 
     */
    CommitTransaction: function(dbcon){
        var dbdriver = module.exports.GetDefaultDriver();
        return dbdriver.commitTransaction(dbcon).then(async function(){
            await dbdriver.releaseConnection(dbcon);
        });
    }, 

    /**
     * rollback a transaction done in a connection
     * @param {dbconnection} dbcon 
     */
    RollbackTransaction: function(dbcon){
        var dbdriver = module.exports.GetDefaultDriver();
        return dbdriver.rollbackTransaction(dbcon).then(async function(){
            await dbdriver.releaseConnection(dbcon);
        });
    },

    /**
     * executes a query using a connection. 
     * Make sure to use the object in connection attribute from the object returned from StartTransaction()
     * @async
     * @param {database connection} dbcon 
     * @param {string} sql 
     * @param {array} args 
     */
    ExecuteQuery: async function(dbcon, sql, args){
        var dbdriver = module.exports.GetDefaultDriver();
        var res = await dbdriver.sendNativeQuery({
            connection: dbcon,
            nativeQuery: sql,
            valuesToEscape: args
        });
        return res.result;
    }, 

    /**
     * executes an sql query and returns the result using the default db driver
     * @async
     * @param {string} sql 
     * @param {array} args 
     */
    ExecuteSingleQuery: async function(sql, args){
        var dbcon = await module.exports.GetDBConnection();
        return module.exports.ExecuteQuery(dbcon.connection, sql, args).then(async function(res){
            var d = module.exports.GetDefaultDriver();
            await d.releaseConnection(dbcon);
            return res;
        });
    }
}