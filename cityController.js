const { Client } = require('@elastic/elasticsearch');
const citiesData = require('./cities.json');

// Function for performing full-text search
async function searchCities(req, res) {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Missing query parameter.' });
    }

    const client = new Client({ node: 'http://localhost:9200' });
    const indexName = 'smart-cities';

    const body = await client.search({
      index: indexName,
      body: {
        query: {
          bool: {
            should: [
              {
                multi_match: {
                  query: q,
                  fields: ["name", "state"],
                  fuzziness: 'AUTO'
                }
              },
              {
                prefix: {
                  name: {
                    value: q.toLowerCase()
                  }
                }
              }
            ]
          }
        }
      }
    });

    console.log('Elasticsearch response:', body);

    if (!body) {
      console.error('Empty response received from Elasticsearch.');
      return res.status(500).json({ error: 'An error occurred while searching for cities.' });
    }

    if (body.error) {
      console.error('Error occurred while searching for cities:', body.error);
      return res.status(500).json({ error: 'An error occurred while searching for cities.' });
    }

    const results = body.hits.hits.map((hit) => ({
      id: hit._id,
      ...hit._source
    }));

    res.json(results);
  } catch (error) {
    console.error('Error occurred while searching for cities:', error);
    res.status(500).json({ error: 'An error occurred while searching for cities.' });
  }
}

// Function for fetching city details
function getCityDetails(req, res) {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({ error: 'Missing city parameter.' });
    }

    // Replace this with your actual logic to fetch city details
    const cityDetails = citiesData.find((c) => c.name.toLowerCase() === city.toLowerCase());

    if (!cityDetails) {
      return res.status(404).json({ error: 'City details not found.' });
    }

    res.json(cityDetails);
  } catch (error) {
    console.error('Error occurred while fetching city details:', error);
    res.status(500).json({ error: 'An error occurred while fetching city details.' });
  }
}

// Function for submitting a review
async function submitReview(req, res) {
    try {
      const { userId, cityId, rating, cityName, reviews } = req.body;
  
      if (!userId || !cityId || !rating || !cityName || !reviews) {
        return res.status(400).json({ error: 'Missing required parameters.' });
      }
  
      const client = new Client({ node: 'http://localhost:9200' });
      const indexName = 'reviews';
  
      const { body: updateResponse } = await client.update({
        index: indexName,
        id: `${userId}_${cityId}`,
        body: {
          doc: {
            userId,
            cityId,
            rating,
            cityName,
            reviews
          },
          upsert: {
            userId,
            cityId,
            rating,
            cityName,
            reviews
          }
        }
      });
  
      res.json({ message: 'Review submitted successfully.' });
    } catch (error) {
      console.error('Error occurred while submitting review:', error);
      res.status(500).json({ error: 'An error occurred while submitting the review.' });
    }
  }
  

module.exports = {
  searchCities,
  getCityDetails,
  submitReview
};
