const { HttpsProxyAgent } = require('https-proxy-agent');
const fetch = require('node-fetch')

async function test() {
  console.log('Testing proxy connection to 192.168.3.1:1070...');
  
  try {
    const proxyAgent = new HttpsProxyAgent('http://192.168.3.1:1070');
    // Using node-fetch because globalThis.fetch in Node >18 might not fully support typical proxy agent options out of the box without undici specifiers. Wait, anthropic SDK handles it.
    // Anthropic SDK officially supports https-proxy-agent injection. Let's test standard http request.
    const https = require('https');
    const req = https.get('https://api.anthropic.com', { agent: proxyAgent }, (res) => {
      console.log('Status:', res.statusCode);
      res.on('data', (d) => process.stdout.write(d));
    });
    
    req.on('error', (e) => {
      console.error('HTTPS ERROR:', e.message);
    });
    
  } catch (err) {
    console.error('AGENT ERROR:', err.message);
  }
}

test();
