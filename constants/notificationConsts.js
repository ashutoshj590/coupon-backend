exports.NOTIFICATION__CONSTS = {
    options : {
        priority: "high",
        timeToLive: 60*60*24
    },

     request_reject : {
        notification: {
            title: "Request Denied!",
            body: "Please check your request data and send again. Your reuquest data is not valid!"
        }
    }, 
   used_coupon : {
            notification : {
                title: "Coupon Used!",
                body: "Your Coupon Code PARAM_COUPON_CODE has been used!."
            }
            
        },
    request_approved : {
            notification : {
                title: "Request Approved!",
                body :"Congratulations your new request has been approved by Admin!"
            }
           
    },
    reset_password : {
            "notification" : {
                "title":"Password Reset",
                "body":"Dear <strong>PARAM_USER_EMAIL</strong> <br /> Your Password has been changed."
        }
    } 



}