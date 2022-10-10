import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders AirBrB link', () => {
  render(<App />);
  const linkElement = screen.getByText(/AirBrB/i);
  expect(linkElement).toBeInTheDocument();
});
