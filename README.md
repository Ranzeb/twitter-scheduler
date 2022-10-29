setup

First you need to install the aws cli  
Then you also need to install pulumi

Now execute the following steps:  
`cd back-end`  
`npm install`



`aws configure`

then add a profile since it makes it easier later to configure other stuff

You need to add those lines to .aws/config (for linux and mac, for windows check here https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)   
`[profile ng]`  
`region = eu-west-1`

In credentials file add those lines  
`[ng]`  
`aws_access_key_id = AKIAY5GMTO2ANDU62L3Y`  
`aws_secret_access_key = 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`  


Now go back to in terminal to back-end folder adn do the following:
`pulumi login`  

`pulumi preview`  
downloads information about stack  
good check to see if login and setup of pulumi worked  
if worked continue, otherwise fix it  
`pulumi config set aws:profile ng`

`cd ..`
cd front-end`
`npm install`
`npm install -g @aws-amplify/cli`

`amplify pull --appId d1z43oh4smne1a --envName dev`
select profile and then ng 



Now it should work  
check by doing in front-end directory  
`npm run start`




----------------------------
----------------------------
other stuff (I will document this later):  
amplify codegen add -apiId 2rrauqjpvvekpnn5j547tryhgy

----------------------------
I suggest we use main for production.
So we only push to main if we are sure that the everything works and we want to release it.
It will be automatically deployed to amplify hosting.
We just have to do:
pulumi stack select prod
pulumi up
amplify env checkout dev
in the backend, this will upload backend to pulumi and deploy it on aws.
If that is done, it should work.

In the future we can also automatically deploy backend using github actions





----------------------------
old IGNORE THIS


I think you have to do the following:
setup another aws profile, so you use the new access keys:
https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html
at this website you can see how, you have to update the credentials and config file
On mac it looks like this:
config file add those lines
[profile ng]
region = eu-west-1

credentials file add those lines
[ng]
aws_access_key_id = AKIAY5GMTO2ANDU62L3Y
aws_secret_access_key = 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


then do this in the back-end folder:
npm install
pulumi config set aws:profile ng
pulumi up



Now the front-end
cd front-end
npm install
npm run dev
