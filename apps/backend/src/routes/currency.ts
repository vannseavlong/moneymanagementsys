import { Router } from 'express';

const router = Router();

// Currency exchange rates (in a real app, you'd fetch from an API)
const exchangeRates = {
  USD_TO_KHR: 4100,
  KHR_TO_USD: 1 / 4100
};

// Get current exchange rates
router.get('/rates', (req, res) => {
  res.json({
    rates: {
      USD_TO_KHR: exchangeRates.USD_TO_KHR,
      KHR_TO_USD: exchangeRates.KHR_TO_USD
    },
    lastUpdated: new Date().toISOString(),
    source: 'Static rates (for demo purposes)'
  });
});

// Convert currency
router.post('/convert', (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;

    if (!amount || !fromCurrency || !toCurrency) {
      return res.status(400).json({ 
        error: 'Amount, fromCurrency, and toCurrency are required' 
      });
    }

    if (!['USD', 'KHR'].includes(fromCurrency) || !['USD', 'KHR'].includes(toCurrency)) {
      return res.status(400).json({ 
        error: 'Supported currencies are USD and KHR only' 
      });
    }

    if (fromCurrency === toCurrency) {
      return res.json({
        originalAmount: amount,
        convertedAmount: amount,
        fromCurrency,
        toCurrency,
        rate: 1
      });
    }

    let convertedAmount: number;
    let rate: number;

    if (fromCurrency === 'USD' && toCurrency === 'KHR') {
      convertedAmount = amount * exchangeRates.USD_TO_KHR;
      rate = exchangeRates.USD_TO_KHR;
    } else if (fromCurrency === 'KHR' && toCurrency === 'USD') {
      convertedAmount = amount * exchangeRates.KHR_TO_USD;
      rate = exchangeRates.KHR_TO_USD;
    } else {
      return res.status(400).json({ error: 'Invalid currency combination' });
    }

    res.json({
      originalAmount: amount,
      convertedAmount: Math.round(convertedAmount * 100) / 100,
      fromCurrency,
      toCurrency,
      rate
    });
  } catch (error) {
    console.error('Currency conversion error:', error);
    res.status(500).json({ error: 'Currency conversion failed' });
  }
});

// Get supported currencies
router.get('/supported', (req, res) => {
  res.json({
    currencies: [
      {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$'
      },
      {
        code: 'KHR',
        name: 'Cambodian Riel',
        symbol: '៛'
      }
    ]
  });
});

export { router as currencyRouter };