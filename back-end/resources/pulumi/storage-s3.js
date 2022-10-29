import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
/*
const twitterMediaEncryptionKey = new aws.kms.Key("twitterMediaEncryptionKey", {
    description: "This key is used to encrypt bucket objects in the twitter-media-bucket",
    deletionWindowInDays: 10,
});
 */
export const twitterMediaBucket = new aws.s3.Bucket("twitter-media", {
    corsRules: [{
        allowedHeaders: ["*"],
        allowedMethods: [
            "PUT",
            "POST",
        ],
        allowedOrigins: [
            'http://localhost:3000',
            'https://develop.d3bft3p6tuw3e.amplifyapp.com',
            'https://main.d3bft3p6tuw3e.amplifyapp.com/'],
        exposeHeaders: ["ETag"],
        maxAgeSeconds: 3000,
    }]
    /*
    serverSideEncryptionConfiguration: {
        rule: {
            applyServerSideEncryptionByDefault: {
                kmsMasterKeyId: twitterMediaEncryptionKey.arn,
                sseAlgorithm: "aws:kms",
            },
        },
    }
     */
});

const bucketPolicy = new aws.s3.BucketPolicy("my-bucket-policy", {
    bucket: twitterMediaBucket.bucket,
    policy: twitterMediaBucket.bucket.apply(publicReadPolicyForBucket)
})

function publicReadPolicyForBucket(bucketName) {
    console.log("bucketName-----------------------------------------")
    console.log(bucketName)
    return JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Action: [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject"
                ],
                Effect: "Allow",
                Principal: "*",
                Resource: [
                    //"arn:aws:s3:::" + bucketName + "/public/*",
                    //"arn:aws:s3:::" + bucketName + "/protected/${cognito-identity.amazonaws.com:sub}/*",
                    "arn:aws:s3:::" + bucketName + "/private/${cognito-identity.amazonaws.com:sub}/*"
                ]
            },
            /*
            {
                Action: [
                    "s3:PutObject"
                ],
                Resource: [
                    "arn:aws:s3:::{enter bucket name}/uploads/*"
                ],
                Effect: "Allow"
            },
            {
                Action: [
                    "s3:GetObject"
                ],
                Resource: [
                    "arn:aws:s3:::{enter bucket name}/protected/*"
                ],
                Effect: "Allow"
            },
            {
                Condition: {
                    'StringLike': {
                        "s3:prefix": [
                            "public/",
                            "public/*",
                            "protected/",
                            "protected/*",
                            "private/${cognito-identity.amazonaws.com:sub}/",
                            "private/${cognito-identity.amazonaws.com:sub}/*"
                        ]
                    }
                },
                Action: [
                    "s3:ListBucket"
                ],
                Resource: [
                    "arn:aws:s3:::{enter bucket name}"
                ],
                Effect: "Allow"
            }
             */
        ]
    })
}

export const twitterMediaBucketId = twitterMediaBucket.id;

/*
async function storeMediaInS3(media, cognitoUserId,) {
    const s3 = new aws.sdk.S3();
    let fileKeys = []
    try {
        for (let mediaFile of media) {
            console.log(typeof mediaFile)
            console.log(mediaFile)
            const extension = 'png'
            const uuid4 = AWS.util.uuid.v4();
            const fileKey = `${cognitoUserId}_${uuid4}.${extension}`
            console.log(fileKey)


            await s3.putObject({
                Bucket: twitterMediaBucket.bucket.get(),
                Key: fileKey,
                Body: mediaFile.toBuffer(),
            }).promise();
            fileKeys.push(fileKey)
        }
    } catch (error) {
        console.log("some error in storeMediaInS3, delete all media from s3 and pass error to user")
        console.log(error)
        //TODO if one fails, remove all from storage, and user should try again???
        for (let fileKey of fileKeys) {
            try {
                await s3.deleteObject({
                    Bucket: twitterMediaBucket.bucket.get(),
                    Key: fileKey
                }).promise();
            } catch (error) {
                console.log("error while removing object")
                console.log(error)
                console.log(fileKey)
            }
        }
    }
    return true;
}
 */