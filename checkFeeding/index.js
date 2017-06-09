/* the second lambda function. it's called every 15 minutes and after a hunger period has ended.
 *  checks if the cat is hungry, and if he is sends an email (only once per hunger period).
 *  also sends an email after a hunger period has ended.
*/
exports.handler = (event, context, callback) => {
    var redis = require("redis");
   //connect to Elasticash
    var client = redis.createClient(6379, 'feedingdates.avfvcf.0001.usw2.cache.amazonaws.com', {no_ready_check: true});
    //get last time fed
    client.get('lastFedDate', function(err, last_fed_reply) {
        console.log(err);
        //get the cat's hunger status (true -> cat is hungry; false -> cat is not hungry)
        client.get('isHungry', function(err, is_hungry_reply){

            console.log(err)
            console.log("cat is hungry? : " + is_hungry_reply);
            if(last_fed_reply){ //if the reply we received with no errors.
                var d = new Date().getTime()/1000; //get the date in seconds
                console.log("last fed date is:");
                console.log(last_fed_reply);
                //checks if the cat hasn't been fed in 15 minutes (900 seconds)
                if(d-last_fed_reply > 900 ){
                    //cat is hungry
                    console.log("sending email");

                    if(is_hungry_reply == "false"){ //if the cat is not hungry already
                        // set cat mode to hungry and send hungry mail
                        sendMail("Your cat is hungry!!", " your cat hasn't ate for "+
                            (((d-last_fed_reply)/60)|0).toString() + " minutes, you must feed him! {*~*}{*~*}{*~*}");
                        client.set('isHungry', "true", function (err, reply) {
                            console.log("incoming replies for setting isHingry to true");
                            console.log(reply);
                            console.log(err);
                            client.quit();
                        });
                    }else{
                        console.log("cat is still hungry");
                        client.quit();
                    }

                }else{

                    //cat has been fed
                    if(is_hungry_reply == "true"){

                        //send email that the cat is not hungry anymore
                        sendMail("Your cat has been fed!!", "GREAT JOB \n\nyou have fed your cat :D:D:D");
                        client.set('isHungry', "false", function (err, reply) {
                            console.log("incoming replies for setting isHungry to false");
                            console.log(reply);
                            console.log(err);
                            client.quit();
                        });
                    }

                }
                console.log("its been " + ((d-last_fed_reply)/60).toString() + "min sience last fed");


            }

        });


    });


    callback(null, 'Hello from Lambda');
};

//sends an email through SMTP
function sendMail(subject, message){
    var email 	= require("emailjs");
    var server 	= email.server.connect({
        user:    "brendelmakmak@gmail.com",
        password:"my mail passsword", //i won't put my mail password on github :)
        host:    "smtp.gmail.com",
        ssl:     true
    });

// send the message and get a callback with an error or details of the message that was sent

    server.send({
        text: message,
        from: "you <username@gmail.com>",
        to: "me <brendelmakmak@gmail.com>",

        subject: subject
    }, function (err, message) {
        console.log(err || message);
    });


}