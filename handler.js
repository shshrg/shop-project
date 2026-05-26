import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, PutCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = 'ProductsTable';


export const createProduct = async (event) => {
  const reqBody = JSON.parse(event.body);
  
  const newProduct = {
      ...reqBody,
  };

  const command = new PutCommand({
    TableName: tableName,
    Item: newProduct
  });

  const response = await docClient.send(command);

  return {
    statusCode: 201,
    body: JSON.stringify(newProduct),
  };
};

export const readProduct = async (event) => {
  const id = event.pathParameters?.id;

  const command = new GetCommand({
    TableName: tableName,
    Key: {
      id: id
    }
  });

  const result = await docClient.send(command);

  if (!result.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'product not found' })
    };
  };

  return {
    statusCode: 200,
    body: JSON.stringify(result.Item)
  };
};

export const updateProduct = async (event) => {
  const id = event.pathParameters?.id;
  const reqBody = JSON.parse(event.body);

  const getCommand = new GetCommand({
    TableName: tableName,
    Key: {
      id: id
    }
  });

  const result = await docClient.send(getCommand);

  if (!result.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'product not found' })
    };
  };

  const newProduct = {
      ...reqBody,
      id: id
  };

  const putCommand = new PutCommand({
    TableName: tableName,
    Item: newProduct
  });

  const response = await docClient.send(putCommand);

  return {
    statusCode: 200,
    body: JSON.stringify(newProduct),
  };

}