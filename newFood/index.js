'use strict';

console.log('Loading function');

const aws = require('aws-sdk');

const s3 = new aws.S3({ apiVersion: '2006-03-01' });


exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    // Get the object from the event and show its content type
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    const params = {
        Bucket: bucket,
        Key: key,
    };
    s3.getObject(params, (err, data) => {
        if (err) {
            console.log(err);
            const message = 'Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.';
            console.log(message);
            callback(message);
        } else {
            //when the object is received with no errors



            var request = require('request');

            var isFood = false;
            var propper_food = ['milk', 'bread', 'fish'];

            var debug = "";


            var imageCode = data.Body.toString('base64');

            //if the picture is too large, sometimes the buffer wont convert the intire image to base64.
            //in order to get a partial image, i complete the base64 string by adding a '/Z' to mark the end of a base64 value.
            if(imageCode[imageCode.length-1] != 'Z' || imageCode[imageCode.length-2] != '/'){
                console.log("PICTURE CORRUPTED", "adding /z to enable partial viewing");
            }

            var headers = {
                "content-type": "application/json",
            }

            //the request that will be sent to the cloud vision api.
            var req = {
                requests: [{
                    image: {
                        content: imageCode
                    },
                    features: [{
                        type: "LABEL_DETECTION",
                        maxResults: 200
                    }]
                }]
            };


            // Configure the request
            var options = {
                headers: headers,
                url: 'https://vision.googleapis.com/v1/images:annotate?key=AIzaSyDgWvUPq6tbX_1LXe2z28A_Z25PLICuLTA',
                method: 'POST',
                body: JSON.stringify(req)
            }

            console.log("starting request");
            //send a request to google vision api
            request.post(options, function (error, response, body){
            // Print out the response body
            console.log("got responce");

            if (!error && response.statusCode == 200) {
                // Print out the response body
                console.log("responce form google is: " + body)

                var res = JSON.parse(body);
                var res_label = res.responses[0].labelAnnotations.map(x => x.description);
                isFood = propper_food.some(x => res_label.includes(x));
                console.log(isFood);

                console.log("isFood is set to: " + isFood.toString());

                //if the picture contains propper food, update the last fed timestamp
                if(isFood){
                    //console.log('CONTENT TYPE:', data.ContentType);
                    var redis = require('redis');
                    var client = redis.createClient(6379, 'feedingdates.avfvcf.0001.usw2.cache.amazonaws.com', {no_ready_check: true});
                    var d = new Date();
                    client.set('lastFedDate', (d.getTime() / 1000).toString(), function (err, reply) {
                        console.log("incoming replies");
                        console.log(reply);
                        console.log(err);

                    });

                    console.log("sent laste fedDate: " + (d.getTime() / 1000).toString());
                    //if the cat is fed after it was hungry, call the other lambda to send an
                    //email about the end of the hunger period
                    client.get('isHungry', function(err, reply) {
                        console.log("error: " + err);
                        console.log("cat is hungry? : " + reply);
                        if(reply == "true"){
                            //call the lambda to send the fed email
                            console.log("calling the email lambda");
                            var lambda = new aws.Lambda({
                                region: 'us-west-2'
                            });

                            lambda.invoke({
                                FunctionName: 'isFed',
                                Payload: JSON.stringify(event, null, 2) // pass params

                            }, function(error, data) {
                                if (error) {
                                    context.done('error', error);
                                }
                                if(data.Payload){
                                    context.succeed(data.Payload)
                                }
                            });
                        }
                        client.quit();
                    });



                }

            } else {
                console.log(body);
                console.log("google had an error: " + error);

            }
            callback(null, data.ContentType);
        });

        }
    });
};
