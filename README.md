# DynamicYiled_Challenge

This git repository contains the solution to the Dynamic Yiled "A Story of APIs and Cats" challenge.

# Challenge description

A cat is being fed by uploading images of appropriate food (fish, milk or bread) into an S3 bucket. 
If the cat was not fed with a proper image for 15 minutes or more, an email shall be automatically sent to an operator’s address. 
If, following a warning email, the cat has then been fed again, a “back to normal” email should be sent. 
There should be only a single alert & backtonormal email pair per hunger period.

# my approach

i used 2 AWS Lambda functions that writes and read data from an ElastiCash database powered by redis.

![alt text](https://github.com/ofirDubi/DynamicYiled_Challenge/blob/master/flow.png)


### First Lambda - CheckFood:

This Lambda funciton is triggered when an item is uploaded to a specific amazon s3 bucket. 
It checks if the item uploaded is a picture of food that the cat can eat, by sending an
https request to Google Cloud Vision API. 

If the image contains a proper food, update the last feeding time in the ElastiCash server.
If the food came after a hunger period, call the second lambda function to send an email notification 
regarding the end of the hunger period.

### Second Lambda - isFed:

This Lambda function is triggered once every 15 minutes or if called from CheckFood.
The function checks if the cat's hunger status by accessing the ElastiCash database.
Then, it determens if the an email regariding the cats hunger status needs to be sent.
it also updates the cat's hunger status on ElastiCash if necessary.

# Some thoughts 
/*
The database/storage part is not really neccesery. Nither do the scheduled run of the second lambda function (isFed).

#### why

In checkFood, we could use the aws-sdk to create a cron-based event (event that triggers in a specific date) on Amazon CloudWatch. the event will be schduled to run 15 minutes after checkFood was activated we can also attach it to isFed as a trigger. every time checkFood is called, it will create a new event that will overwrite the last event created. By doing this, it is guaranteed that isFed will only run when the cat is hungry - so there is no need for a database to store the timestamp.
*/
right now, the mail-sending system is not perfect. Because isFed is only called once every 15 minutes, then it wont send an email as soon as the cat is hungry. for example:
if isFed runs every 15 minutes starting from minute 0, and the cat has been fed in minute 5, at the 15 minute mark when isFed will run 
the function wont send an alert email because the cat is not hungry. The cat will be hungry at 20 min, but a notification will, only be sent in min 30.

A posssible solution to this problem is to create a scheduled event on Amazon CloudWatch and attach it as a trigger to isFed every time checkFood is called. This can be achived by using the aws-sdk.  
every time checkFood is called, it will create a new event that will overwrite the last event created.
That way, isFed will be called when the cat is hungry.

I wont have time to implement this solution, sience i have a bagrut next week.

