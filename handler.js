import { v4 } from 'uuid'
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, PutCommand, UpdateCommand, DeleteCommand, ScanCommand, QueryCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';


const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = 'ProductsTable';
const headers = {
  'content-type': 'application/json'
};
const allowedFields = ['name', 'description', 'price', 'category', 'createDate']

const getProductById = async (productId) => {
  const command = new GetCommand({
    TableName: tableName,
    Key: {
      id: productId
    }
  });

  const response = await docClient.send(command);

  return response.Item;
};

const putProduct = async (product) => {
  const command = new PutCommand({
    TableName: tableName,
    Item: product
  });

  const response = await docClient.send(command);
  return response;
};


export const authorizerFunc = async (event) => {
  const authToken = event.headers?.authorization;
  console.log(authToken);

  if (authToken === 'adminToken') {
    console.log('allowed');
    return {
      'principalId': 'ADMIN',
      'policyDocument': {
        'Version': '2012-10-17',
        'Statement': [{
          'Action': 'execute-api:Invoke',
          'Effect': 'Allow',
          'Resource': event.routeArn
        }]
      }
    };
  }

  console.log('denied')
  return {
      'principalId': 'USER',
      'policyDocument': {
        'Version': '2012-10-17',
        'Statement': [{
          'Action': 'execute-api:Invoke',
          'Effect': 'Deny',
          'Resource': event.routeArn
        }]
      }
    };
  
};


export const createProduct = async (event) => {
  const reqBody = JSON.parse(event.body);

  if (!reqBody['name'] || typeof reqBody['name'] != 'string') {
    return {
      statusCode: 400,
      body: 'Invalid data'
    };
  }
  
  const newProduct = {
      id: v4()
  };

  for (const field of allowedFields) {
    if (reqBody[field]) {
      newProduct[field] = reqBody[field];
    }
  }

  const command = new PutCommand({
    TableName: tableName,
    Item: newProduct
  });

  const response = await docClient.send(command);

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify(newProduct),
  };
};

export const readProduct = async (event) => {
  const id = event.pathParameters?.id;

  const result = await getProductById(id);

  if (!result) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'product not found' })
    };
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(result)
  };
};

export const updateProduct = async (event) => {
  const id = event.pathParameters?.id;
  const reqBody = JSON.parse(event.body);

  const result = await getProductById(id);

  if (!result) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'product not found' })
    };
  };

  const newProduct = {
      ...reqBody,
      id: id
  };

  await putProduct(newProduct);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(newProduct),
  };

};

export const deleteProduct = async (event) => {
  const id = event.pathParameters?.id;
  const result = await getProductById(id);

  if (!result) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'product not found' })
    };
  };

  const deleteCommand = new DeleteCommand({
    TableName: tableName,
    Key: {
      id: id
    }
  });

  const response = await docClient.send(deleteCommand);

  return {
    statusCode: 204,
    body: ""
  };
};


export const listProducts = async (event) => {
  const category = event.queryStringParameters?.category;

  console.log(category);

  if (category) {
    const command = new QueryCommand({
      TableName: tableName,
      IndexName: 'CategoryIndex',
      ExpressionAttributeValues: {
        ":cat": category
      },
      KeyConditionExpression: "category = :cat"
      
    })
    const response = await docClient.send(command);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response.Items)
    };
  }

  const command = new ScanCommand({
    TableName: tableName
  });

  const response = await docClient.send(command);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(response.Items)
  };
};