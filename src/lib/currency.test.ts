// Test file to verify currency conversion functions
import { 
  convertUSDToINR,
  convertMarketCapToINR,
  getUSDToINRRate,
  CURRENCY_FIELDS
} from './currency';

// Test the currency conversion functions
describe('Currency Conversion', () => {
  it('should convert USD to INR', async () => {
    const result = await convertUSDToINR(100);
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThan(0);
  });

  it('should convert market cap to INR', async () => {
    const result = await convertMarketCapToINR(1000000000);
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThan(0);
  });

  it('should get USD to INR rate', async () => {
    const rate = await getUSDToINRRate();
    expect(typeof rate).toBe('number');
    expect(rate).toBeGreaterThan(0);
  });

  it('should have currency fields defined', () => {
    expect(Array.isArray(CURRENCY_FIELDS)).toBe(true);
    expect(CURRENCY_FIELDS.length).toBeGreaterThan(0);
  });
});