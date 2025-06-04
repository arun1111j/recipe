const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'recipes_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

async function initializeDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS recipes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                cuisine VARCHAR(255) NOT NULL,
                rating DECIMAL(3,1),
                prep_time INT,
                cook_time INT,
                total_time INT,
                description TEXT,
                nutrients JSON,
                serves VARCHAR(50)
            )
        `);

        const [rows] = await pool.query('SELECT COUNT(*) AS count FROM recipes');
        if (rows[0].count === 0) {
            await pool.query(
                `INSERT INTO recipes (
                    title, cuisine, rating, prep_time, cook_time, 
                    total_time, description, nutrients, serves
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                    "Sweet Potato Pie",
                    "Southern Recipes",
                    4.8,
                    15,
                    100,
                    115,
                    "Shared from a Southern recipe, this homemade sweet potato pie...",
                    JSON.stringify({
                        calories: "389 kcal",
                        carbohydrateContent: "48 g",
                        cholesterolContent: "78 mg",
                        fiberContent: "3 g",
                        proteinContent: "5 g",
                        saturatedFatContent: "10 g",
                        sodiumContent: "254 mg",
                        sugarContent: "28 g",
                        fatContent: "21 g"
                    }),
                    "8 servings"
                ]
            );
        }
    } catch (err) {
        console.error(err);
    }
}

// Get all recipes with pagination and sorting
app.get('/api/recipes', async(req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const orderBy = req.query.orderBy || 'rating';
        const orderDirection = req.query.orderDirection || 'DESC';

        const validColumns = ['id', 'title', 'cuisine', 'rating', 'prep_time', 'cook_time', 'total_time'];
        if (!validColumns.includes(orderBy)) {
            return res.status(400).json({ error: 'Invalid orderBy parameter' });
        }

        if (orderDirection !== 'ASC' && orderDirection !== 'DESC') {
            return res.status(400).json({ error: 'Invalid orderDirection parameter' });
        }

        const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM recipes');
        const total = countRows[0].total;

        const [rows] = await pool.query(
            `SELECT * FROM recipes 
             ORDER BY ${orderBy} ${orderDirection} 
             LIMIT ? OFFSET ?`, [limit, offset]
        );

        const response = {
            page,
            limit,
            total,
            data: rows.map(row => ({
                ...row,
                nutrients: typeof row.nutrients === 'string' ? JSON.parse(row.nutrients) : row.nutrients
            }))
        };

        res.json(response);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Search recipes with filters
app.get('/api/recipes/search', async(req, res) => {
    try {
        const { title, cuisine, min_rating, max_rating, min_time, max_time } = req.query;
        let query = 'SELECT * FROM recipes WHERE 1=1';
        const params = [];

        if (title) {
            query += ' AND title LIKE ?';
            params.push(`%${title}%`);
        }

        if (cuisine) {
            query += ' AND cuisine LIKE ?';
            params.push(`%${cuisine}%`);
        }

        if (min_rating) {
            query += ' AND rating >= ?';
            params.push(parseFloat(min_rating));
        }

        if (max_rating) {
            query += ' AND rating <= ?';
            params.push(parseFloat(max_rating));
        }

        if (min_time) {
            query += ' AND total_time >= ?';
            params.push(parseInt(min_time));
        }

        if (max_time) {
            query += ' AND total_time <= ?';
            params.push(parseInt(max_time));
        }

        const [rows] = await pool.query(query, params);

        res.json(rows.map(row => ({
            ...row,
            nutrients: typeof row.nutrients === 'string' ? JSON.parse(row.nutrients) : row.nutrients
        })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get single recipe by ID
app.get('/api/recipes/:id', async(req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM recipes WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Recipe not found' });
        }

        const recipe = {
            ...rows[0],
            nutrients: typeof rows[0].nutrients === 'string' ? JSON.parse(rows[0].nutrients) : rows[0].nutrients
        };

        res.json(recipe);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Create new recipe
app.post('/api/recipes', async(req, res) => {
    try {
        const { title, cuisine, rating, prep_time, cook_time, total_time, description, nutrients, serves } = req.body;

        if (!title || !cuisine) {
            return res.status(400).json({ error: 'Title and cuisine are required' });
        }

        const [result] = await pool.query(
            `INSERT INTO recipes (
                title, cuisine, rating, prep_time, cook_time, 
                total_time, description, nutrients, serves
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                title,
                cuisine,
                rating || null,
                prep_time || null,
                cook_time || null,
                total_time || null,
                description || null,
                JSON.stringify(nutrients || {}),
                serves || null
            ]
        );

        const [newRecipe] = await pool.query('SELECT * FROM recipes WHERE id = ?', [result.insertId]);

        res.status(201).json({
            ...newRecipe[0],
            nutrients: typeof newRecipe[0].nutrients === 'string' ? JSON.parse(newRecipe[0].nutrients) : newRecipe[0].nutrients
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async() => {
    await initializeDatabase();
    console.log(`Server running on port ${PORT}`);
});