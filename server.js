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
const { checkEligibility, analyzePhoto, detectFraud, makeDecision } = require('./routes/ai');

app.post('/api/process-return', async (req, res) => {
  try {
    const { return_id, order_id, customer_email } = req.body;

    const eligibilityResult = await checkEligibility({
      purchase_date: '2025-10-15',
      product_sku: 'SHIRT-001',
      customer_id: customer_email,
      reason: 'Too small'
    });

    const photoResult = await analyzePhoto('Item appears brand new, still has tags');

    const fraudResult = await detectFraud({
      total_returns: 2,
      total_denied: 0
    });

    const decision = await makeDecision({
      eligibility: eligibilityResult,
      photo_condition: photoResult,
      fraud_score: fraudResult
    });

    const { error: updateError } = await supabase
      .from('returns')
      .update({
        eligibility_check_result: eligibilityResult,
        photo_analysis_result: photoResult,
        fraud_flag: fraudResult.includes('FRAUD_SCORE: 50'),
        final_decision: decision
      })
      .eq('return_id', return_id);

    if (updateError) throw updateError;

    res.json({
      success: true,
      return_id,
      decision,
      details: { eligibility: eligibilityResult, photo: photoResult, fraud: fraudResult }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

