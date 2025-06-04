import json

def sql_value(value):
    if value is None:
        return "NULL"
    elif isinstance(value, (int, float)):
        return str(value)
    elif isinstance(value, dict):
        return f"'{json.dumps(value)}'"
    else:
        return f"'{str(value).replace("'", "''")}'"

with open('recipes.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

with open('import_recipes_fixed.sql', 'w', encoding='utf-8') as sql_file:
    sql_file.write("""SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS recipes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cuisine VARCHAR(255),
    title VARCHAR(255),
    rating TEXT,
    prep_time INT,
    cook_time INT,
    total_time INT,
    description TEXT,
    nutrients JSON,
    serves VARCHAR(255)
);

""")

    for key, recipe in data.items():
        values = [
            sql_value(recipe.get('cuisine')),
            sql_value(recipe.get('title')),
            sql_value(recipe.get('rating')),
            sql_value(recipe.get('prep_time')),
            sql_value(recipe.get('cook_time')),
            sql_value(recipe.get('total_time')),
            sql_value(recipe.get('description')),
            sql_value(recipe.get('nutrients', {})),
            sql_value(recipe.get('serves'))
        ]
        
        sql_file.write(
            "INSERT INTO recipes (cuisine, title, rating, prep_time, cook_time, "
            "total_time, description, nutrients, serves) VALUES ("
            + ", ".join(values) + ");\n"
        )

    sql_file.write("\nSET FOREIGN_KEY_CHECKS=1;")
    print("SQL file generated successfully with proper NULL handling!")