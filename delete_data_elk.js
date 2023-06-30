const { Client } = require('@elastic/elasticsearch');

async function deleteAllData() {
  try {
    const client = new Client({ node: 'http://localhost:9200' });
    const indexName = 'reviews'; // index name I want to delete

    const response = await client.deleteByQuery({
      index: indexName,
      body: {
        query: {
          match_all: {}
        }
      }
    });

    console.log(`Deleted documents from ${indexName}`);
  } catch (error) {
    console.error('Error deleting data:', error);
  }
}

// Call the function to delete all data
deleteAllData();