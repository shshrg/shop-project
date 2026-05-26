import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, PutCommand, DeleteCommand, ScanCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';


const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = 'ProductsTable';
const headers = {
  'content-type': 'application/json'
};

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

export const createProduct = async (event) => {
  const reqBody = JSON.parse(event.body);
  
  const newProduct = {
      ...reqBody,
  };

  await putProduct(newProduct);

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