import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PriceTracker from '../pages/PriceTracker';

jest.mock('../utils/wallet', () => ({
  connectWallet: jest.fn().mockResolvedValue('0x1234567890abcdef'),
  addWalletListener: jest.fn(),
}));

describe('PriceTracker Component', () => {
  test('renders connect wallet button when not connected', () => {
    render(<PriceTracker />);
    const connectButton = screen.getByText(/Connect MetaMask/i);
    expect(connectButton).toBeInTheDocument();
  });

  test('connects wallet on button click', async () => {
    render(<PriceTracker />);
    const connectButton = screen.getByText(/Connect MetaMask/i);
    fireEvent.click(connectButton);

    const accountInfo = await screen.findByText(/Connected: 0x1234...cdef/i);
    expect(accountInfo).toBeInTheDocument();
  });
});
