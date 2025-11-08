require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.get('/health', (req, res) => {
  res.json({ status: 'Server is running!', timestamp: new Date() });
});

app.post('/api/returns', async (req, res) => {
  try {
    const {
      return_id,
      order_id,
      customer_email,
      product_sku,
      reason,
      photos_url,
      requested_refund
    } = req.body;

    const { data, error } = await supabase
      .from('returns')
      .insert([{
        return_id,
        order_id,
        customer_email,
        product_sku,
        reason,
        photos_url,
        requested_refund,
        final_decision: 'PENDING_REVIEW'
      }]);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Return received',
      return_id,
      data
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/returns/:return_id', async (req, res) => {
  try {
    const { return_id } = req.params;
    
    const { data, error } = await supabase
      .from('returns')
      .select('*')
      .eq('return_id', return_id)
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

