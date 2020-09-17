var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var categoryService = require('../services/categoryService.js');
var util = require('../lib/Utils.js');
var consts = require('../lib/consts.js');
var jsonParser = bodyParser.json({limit: '10mb'});
var sessionTime = 1 * 60 *  60 * 1000;       //1 hour session

var expressJwt = require('express-jwt');

const SERVER_SECRET = 'vidyapathaisalwaysrunning';


const authenticate = expressJwt({secret : SERVER_SECRET, algorithms: ['HS256'] });




/* API for  Add new Category.............*/
router.post('/add-category', [jsonParser, util.hasJsonParam(["name"])], function (req, res) {
    categoryService.createCategory(req.body.name, req.body.thumb_url, req.body.status).then(function (categories) {
            var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
            response.categories = categories;
            res.send(response);
        }, function (err) {
            if(err.errors !== undefined && err.errors[0] !== undefined ){
                var response = util.getResponseObject(consts.RESPONSE_ERROR, err.response);
                res.send(response);
            }else{
                var response = util.getResponseObject(consts.RESPONSE_ERROR, err.response);
            }
            res.send(response);
        }
    );
});


/* API for get all category form database.............*/
router.post('/get-all-category',authenticate,jsonParser, function (req, res) {
    categoryService.getAllcategory().then(function (categorylist) {
            var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
            response['categories'] = categorylist;
            res.send(response);
        }, function (err) {
            if(err.errors !== undefined && err.errors[0] !== undefined ){
                var response = util.getResponseObject(consts.RESPONSE_ERROR, err.response);
                res.send(response);
            }else{
                var response = util.getResponseObject(consts.RESPONSE_ERROR, err.response);
            }
            res.send(response);
        }
    );
});

/* API for mark is_deleted to category ................*/

router.post('/delete-category',[jsonParser,util.hasJsonParam(["category_id"])], function (req, res) { //, util.allowedUser(["admin"])
categoryService.changeStatustoCategory(req.body.category_id).then(function (statusUpdated) {
            var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
            res.send(response);
        }, function (err) {
            if(err.errors !== undefined && err.errors[0] !== undefined ){
                var response = util.getResponseObject(consts.RESPONSE_ERROR, err.response);
                res.send(response);
            }else{
                var response = util.getResponseObject(consts.RESPONSE_ERROR, err.response);
            }
            res.send(response);
        }
    );
});


/* API for  Add new Sub Category.............*/
router.post('/add-sub-category', [jsonParser, util.hasJsonParam(["category_id","name"])], function (req, res) {
    categoryService.createSubCategory(req.body.category_id, req.body.name, req.body.img_url, req.body.status).then(function (subCategories) {
            var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
            response.subCategories = subCategories;
            res.send(response);
        }, function (err) {
            if(err.errors !== undefined && err.errors[0] !== undefined ){
                var response = util.getResponseObject(consts.RESPONSE_ERROR, err.response);
                res.send(response);
            }else{
                var response = util.getResponseObject(consts.RESPONSE_ERROR, err.response);
            }
            res.send(response);
        }
    );
});


/* API for get sub category form database.............*/
router.post('/get-sub-category',[jsonParser, util.hasJsonParam(["category_id"])], function (req, res) {
    categoryService.getSubcategory(req.body.category_id).then(function (subCategorylist) {
            var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
            response['category_id'] = req.body.category_id;
            response['subCategories'] = subCategorylist;
            res.send(response);
        }, function (err) {
            if(err.errors !== undefined && err.errors[0] !== undefined ){
                var response = util.getResponseObject(consts.RESPONSE_ERROR, err.response);
                res.send(response);
            }else{
                var response = util.getResponseObject(consts.RESPONSE_ERROR, err.response);
            }
            res.send(response);
        }
    );
});

/* API for mark is_deleted to sub category ................*/

router.post('/delete-sub-category',[jsonParser,util.hasJsonParam(["sub_category_id"])], function (req, res) { //, util.allowedUser(["admin"])
categoryService.changeStatustoSubCategory(req.body.sub_category_id).then(function (statusUpdated) {
            var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
            res.send(response);
        }, function (err) {
            if(err.errors !== undefined && err.errors[0] !== undefined ){
                var response = util.getResponseObject(consts.RESPONSE_ERROR, err.response);
                res.send(response);
            }else{
                var response = util.getResponseObject(consts.RESPONSE_ERROR, err.response);
            }
            res.send(response);
        }
    );
});



module.exports = router;