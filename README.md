# DynamicYiled_Challenge

This git repository contains the solution to the Dynamic Yiled "A Story of APIs and Cats" challenge.

# Challenge description

A cat is being fed by uploading images of appropriate food (fish, milk or bread) into an S3 bucket. 
If the cat was not fed with a proper image for 15 minutes or more, an email shall be automatically sent to an operator’s address. 
If, following a warning email, the cat has then been fed again, a “back to normal” email should be sent. 
There should be only a single alert & backtonormal email pair per hunger period.

# my approach

i used 2 AWS Lambda functions that writes and read data from an ElastiCash database powered by redis.

### First Lambda - CheckFood:

This lambda funciton is triggered when an item is uploaded to a specific amazon s3 bucket. 
It checks if the item uploaded is a picture of food that the cat can eat, by sending an
https request to Google Cloud Vision API. 

If the image contains a proper food, update the last feeding time in the ElastiCash server.
If the food came after a hunger period, call the second lambda function to send an email notification 
regarding the end of the hunger period.
