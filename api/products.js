// Vercel Serverless Function: /api/products
// Provides GET and POST endpoints for product management

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // If using KV or external database via environment variables
  if (req.method === 'GET') {
    // Return stored products or empty array
    return res.status(200).json({
      status: 'ok',
      message: 'Serverless API Ready for Cloud Database connection'
    });
  }

  if (req.method === 'POST') {
    const products = req.body;
    return res.status(200).json({
      status: 'success',
      count: Array.isArray(products) ? products.length : 0
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
