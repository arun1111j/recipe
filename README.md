# Recipe Management API Documentation

## Technologies Used
Node.js with Express

MySQL (using mysql2/promise)

Body-parser (for parsing JSON request bodies)

## Setup
Install dependencies:

```
npm install express mysql2 body-parser
Start the server:

node app.js
It will auto-create the recipes table and insert one sample recipe if empty.
```
## Database Table: recipes
Field	Type	Description
id	INT AUTO_INCREMENT	Primary Key
title	VARCHAR(255)	Title of the recipe (Required)
cuisine	VARCHAR(255)	Cuisine category (Required)
rating	DECIMAL(3,1)	Recipe rating (e.g., 4.5)
prep_time	INT	Preparation time in minutes
cook_time	INT	Cooking time in minutes
total_time	INT	Total time (prep + cook)
description	TEXT	Description of the recipe
nutrients	JSON	Nutritional values
serves	VARCHAR(50)	Number of servings

## Endpoints
## Request :
🔹GET http://localhost:3000/api/recipes?page=2&limit=50
## Response :
![image](https://github.com/user-attachments/assets/740c26a1-d6a8-4166-be3c-ea246606f105)
## Request :
🔹GET http://localhost:3000/api/recipes/search?calories=<=400&title=pie&rating=>=4.5
## Response :
![image](https://github.com/user-attachments/assets/b52c371e-29fc-4917-8543-94bba6fc8760)

## Result:
the api backend has been completed using node.js + sql 
