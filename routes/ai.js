const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function checkEligibility(orderData) {
  const prompt = `You are a returns eligibility checker. Check if this return is eligible.

Order Details:
- Purchase Date: ${orderData.purchase_date}
- Product SKU: ${orderData.product_sku}
- Customer ID: ${orderData.customer_id}
- Return Reason: ${orderData.reason}

Rules:
1. Return must be within 30 days of purchase
2. Product cannot be from excluded list
3. Customer cannot have more than 10 returns in past 12 months

Respond with ONLY: ELIGIBLE: YES or ELIGIBLE: NO`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    });

    return response.choices.message.content;
  } catch (error) {
    console.error('OpenAI error:', error);
    return 'ELIGIBLE: PENDING_HUMAN_REVIEW';
  }
}

async function analyzePhoto(description) {
  const prompt = `Analyze this product return based on description. Rate the condition.

Description: ${description}

Respond with: CONDITION: LIKE_NEW or GOOD or USED or DAMAGED`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    });

    return response.choices.message.content;
  } catch (error) {
    console.error('Photo analysis error:', error);
    return 'CONDITION: PENDING_REVIEW';
  }
}

async function detectFraud(customerData) {
  const prompt = `Analyze customer return history for fraud patterns.

Customer History:
- Total Returns: ${customerData.total_returns}
- Denied Returns: ${customerData.total_denied}

Red Flags:
1. More than 5 returns in 30 days
2. High return rate (>20%)
3. Same denial reason repeated

Fraud Score (0-100): [Calculate score]
Respond with: FRAUD_SCORE: [0-100]`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    });

    return response.choices.message.content;
  } catch (error) {
    console.error('Fraud detection error:', error);
    return 'FRAUD_SCORE: 0';
  }
}

async function makeDecision(allAnalysis) {
  const prompt = `Based on this analysis, make a return decision.

Eligibility: ${allAnalysis.eligibility}
Photo Condition: ${allAnalysis.photo_condition}
Fraud Score: ${allAnalysis.fraud_score}

Decision: APPROVE or DENY or PENDING_REVIEW
Respond with only the decision.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    });

    return response.choices.message.content;
  } catch (error) {
    console.error('Decision error:', error);
    return 'DECISION: PENDING_REVIEW';
  }
}

module.exports = {
  checkEligibility,
  analyzePhoto,
  detectFraud,
  makeDecision
};
