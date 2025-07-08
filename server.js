const express = require('express')
const { MongoClient } = require('mongodb')
const yaml = require('js-yaml')
const fs = require('fs')

const app = express()
const port = process.env.PORT || 3000

let env
try {
  env = yaml.safeLoad(fs.readFileSync('env.yml', 'utf8'))
} catch (e) {
  console.error('Error loading env.yml:', e)
  process.exit(1)
}

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017'
const dbName = process.env.DB_NAME || 'recipe_app'
const collectionName = 'recipes'

let db

async function connectToMongo() {
  const client = new MongoClient(mongoUri)
  try {
    await client.connect()
    db = client.db(dbName)
    console.log('Connected to MongoDB!')
  } catch (err) {
    console.error('Error connecting to MongoDB:', err)
    process.exit(1)
  }
}

connectToMongo()

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  next()
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.status(404).send('Not Found')
})

app.get('/recipes', async (req, res) => {
  if (!db) {
    console.error('Database connection not established.')
    return res.status(500)
  }
  try {
    // 'recipes' コレクションからすべてのドキュメントを取得
    const recipes = await db.collection(collectionName).find({}).toArray()
    res.status(200).json({ recipes: recipes })
  } catch (err) {
    console.error('Error fetching recipes from MongoDB:', err)
    res.status(500).json({ message: 'Failed to retrieve recipes' })
  }
})

app.use((req, res) => {
  res.status(404).send('Not Found')
})

app.listen(port, () => {
  console.log(`Express server running on port ${port}`)
  console.log(`Access URL: ${env.BASE_URL || `http://localhost:${port}`}`)
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})
