import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { GenerationsProvider, useGenerations, DEFAULT_NUM_GENERATIONS, MIN_NUM_GENERATIONS } from '../GenerationsContext';

// Mock component that uses the context
const TestComponent = () => {
  const { numGenerations, incrementGenerations, decrementGenerations, setNumGenerations } = useGenerations();
  
  return (
    <div>
      <div data-testid="num-generations">{numGenerations}</div>
      <button data-testid="increment" onClick={incrementGenerations}>Increment</button>
      <button data-testid="decrement" onClick={decrementGenerations}>Decrement</button>
      <button data-testid="set-min" onClick={() => setNumGenerations(MIN_NUM_GENERATIONS)}>Set Min</button>
      <button data-testid="set-high" onClick={() => setNumGenerations(20)}>Set High</button>
      <button data-testid="set-invalid-low" onClick={() => setNumGenerations(-5)}>Set Invalid Low</button>
    </div>
  );
};

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('GenerationsContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  
  it('should initialize with default value', () => {
    render(
      <GenerationsProvider>
        <TestComponent />
      </GenerationsProvider>
    );
    
    expect(screen.getByTestId('num-generations').textContent).toBe(DEFAULT_NUM_GENERATIONS.toString());
  });
  
  it('should increment the number of generations', () => {
    render(
      <GenerationsProvider>
        <TestComponent />
      </GenerationsProvider>
    );
    
    const initialValue = parseInt(screen.getByTestId('num-generations').textContent || '0', 10);
    fireEvent.click(screen.getByTestId('increment'));
    expect(screen.getByTestId('num-generations').textContent).toBe((initialValue + 1).toString());
  });
  
  it('should decrement the number of generations', () => {
    render(
      <GenerationsProvider>
        <TestComponent />
      </GenerationsProvider>
    );
    
    // First increment to ensure we're not at the minimum
    fireEvent.click(screen.getByTestId('increment'));
    const valueAfterIncrement = parseInt(screen.getByTestId('num-generations').textContent || '0', 10);
    
    fireEvent.click(screen.getByTestId('decrement'));
    expect(screen.getByTestId('num-generations').textContent).toBe((valueAfterIncrement - 1).toString());
  });
  
  it('should not decrement below the minimum value', () => {
    render(
      <GenerationsProvider>
        <TestComponent />
      </GenerationsProvider>
    );
    
    // Set to minimum
    fireEvent.click(screen.getByTestId('set-min'));
    
    // Try to decrement
    fireEvent.click(screen.getByTestId('decrement'));
    
    // Should still be at minimum
    expect(screen.getByTestId('num-generations').textContent).toBe(MIN_NUM_GENERATIONS.toString());
  });
  
  it('should allow setting to high values', () => {
    render(
      <GenerationsProvider>
        <TestComponent />
      </GenerationsProvider>
    );
    
    // Set to a high value
    fireEvent.click(screen.getByTestId('set-high'));
    
    // Should be set to 20
    expect(screen.getByTestId('num-generations').textContent).toBe('20');
  });
  
  it('should enforce minimum value when setting directly', () => {
    render(
      <GenerationsProvider>
        <TestComponent />
      </GenerationsProvider>
    );
    
    // Try to set below minimum
    fireEvent.click(screen.getByTestId('set-invalid-low'));
    
    // Should be at minimum
    expect(screen.getByTestId('num-generations').textContent).toBe(MIN_NUM_GENERATIONS.toString());
  });
  
  it('should persist value to localStorage', () => {
    render(
      <GenerationsProvider>
        <TestComponent />
      </GenerationsProvider>
    );
    
    // Set a specific value
    const testValue = 6;
    act(() => {
      fireEvent.click(screen.getByTestId('set-min'));
      // Increment to a known value
      for (let i = MIN_NUM_GENERATIONS; i < testValue; i++) {
        fireEvent.click(screen.getByTestId('increment'));
      }
    });
    
    // Check localStorage
    expect(window.localStorage.getItem('numGenerations')).toBe(testValue.toString());
  });
  
  it('should load value from localStorage on initialization', () => {
    // Set value in localStorage
    const testValue = 7;
    window.localStorage.setItem('numGenerations', testValue.toString());
    
    // Render component
    render(
      <GenerationsProvider>
        <TestComponent />
      </GenerationsProvider>
    );
    
    // Check if value was loaded
    expect(screen.getByTestId('num-generations').textContent).toBe(testValue.toString());
  });
}); 