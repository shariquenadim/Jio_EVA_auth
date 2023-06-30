const { Client } = require('@elastic/elasticsearch');
const citiesData = require('./cities.json');

async function loadData() {
  try {
    const client = new Client({ node: 'http://localhost:9200' });
    const indexName = 'smart-cities';

    // Check if the index exists
    const indexExists = await client.indices.exists({ index: indexName });

    if (!indexExists) {
      // Create the index if it doesn't exist
      await client.indices.create({ index: indexName });

      // Define the mapping for the index
      const mapping = {
        properties: {
          name: { type: 'text' },
          state: { type: 'text' },
          population: { type: 'integer' },
          latitude: { type: 'float' },
          longitude: { type: 'float' }
        }
      };

      // Set the mapping for the index
      await client.indices.putMapping({
        index: indexName,
        body: mapping
      });

      // Bulk index the cities data
      const body = [];
      citiesData.forEach(city => {
        body.push({ index: { _index: indexName } });
        body.push(city);
      });

      await client.bulk({ refresh: true, body });

      console.log('Data loaded successfully');
    } else {
      console.log('Index already exists. Skipping data loading.');
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

module.exports = loadData;