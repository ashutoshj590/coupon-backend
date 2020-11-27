var express = require('express');
var router = express.Router();
var app = express();
var bodyParser = require('body-parser');
var categoryService = require('../services/categoryService.js');
var util = require('../lib/Utils.js');
var consts = require('../lib/consts.js');
var jsonParser = bodyParser.json({limit: '10mb'});
var sessionTime = 1 * 60 *  60 * 1000;       //1 hour session
const jwt = require('jsonwebtoken');
var multer = require('multer');
var fileExtension = require('file-extension')
var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/images/uploaded_images/')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + '.' + fileExtension(file.originalname))
    }
})

var upload = multer({
    storage: storage,
    limits: {
        // Setting Image Size Limit to 2MBs
        fileSize: 2000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            //Error 
            cb(new Error('Please upload JPG and PNG images only!'))
        }
        //Success 
        cb(undefined, true)
    }
})


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
router.post('/get-all-category',util.verifyToken,jsonParser, function (req, res) {
    jwt.verify(req.token, 'secretkey', (err, authData) => {
        if(err) {
            res.send("Please use valid token!");
        } else {
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
        }
 })
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
router.post('/add-sub-category', upload.single('subcateimg'), function (req, res) {
    categoryService.createSubCategory(req.body.category_id, req.body.name, req.file).then(function (subCategories) {
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


router.post('/file', upload.single('uploadedImage'), (req, res, next) => {
    const file = req.file;
    console.log(file.filename);
    if (!file) {
        const error = new Error('No File')
        error.httpStatusCode = 400
        return next(error)
    }
    res.send(file);

})




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


router.post('/get-category-data',jsonParser, function (req, res) {
    categoryService.getAllcategoryData().then(function (subcategorylist) {
        var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
            response['sub_category_data'] = subcategorylist;
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




router.post('/admin-reports',jsonParser, function (req, res) {
    categoryService.getAllCountsForConsumer().then(function (result) {
                var response = util.getResponseObject(consts.RESPONSE_SUCCESS);
               // response.detail = result;
                res.send(result);
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