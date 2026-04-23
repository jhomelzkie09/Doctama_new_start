export default async function handler(req, res) {
  const API_URL = process.env.RENDER_API_URL || 'doctamaapisimple-production.up.railway.app';
  
  try {
    const response = await fetch(`${API_URL}/api/health`);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(`❌ Keep-alive failed: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}