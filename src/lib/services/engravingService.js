import { createPythonEngravingStyles } from '../pythonEngraving.js';
import { createProfessionalPetEngraving } from '../professionalPetEngraving.js';

export class EngravingService {
  constructor() {
    this.methods = [
      { name: 'professionalPetEngraving', fn: createProfessionalPetEngraving, priority: 1 },
      { name: 'pythonEngraving', fn: createPythonEngravingStyles, priority: 2 }
    ];
  }

  async createEngraving(imageUrl, options = {}) {
    const { preferredMethod, fallbackEnabled = true } = options;
    
    console.log('🎨 Starting engraving process...');
    
    // Try preferred method first if specified
    if (preferredMethod) {
      const method = this.methods.find(m => m.name === preferredMethod);
      if (method) {
        try {
          const result = await method.fn(imageUrl);
          if (result.success) {
            return result;
          }
        } catch (error) {
          console.warn(`Preferred method ${preferredMethod} failed:`, error.message);
        }
      }
    }
    
    // If fallback is enabled, try methods by priority
    if (fallbackEnabled) {
      const sortedMethods = [...this.methods].sort((a, b) => a.priority - b.priority);
      
      for (const method of sortedMethods) {
        if (method.name === preferredMethod) continue; // Skip already tried
        
        try {
          console.log(`Trying ${method.name} engraving...`);
          const result = await method.fn(imageUrl);
          
          if (result.success) {
            return {
              ...result,
              method: method.name
            };
          }
        } catch (error) {
          console.warn(`${method.name} failed:`, error.message);
        }
      }
    }
    
    return {
      success: false,
      error: 'All engraving methods failed'
    };
  }

  async createMultipleStyles(imageUrl) {
    const results = {};
    const errors = [];
    
    for (const method of this.methods.slice(0, 3)) { // Top 3 methods
      try {
        const result = await method.fn(imageUrl);
        if (result.success) {
          results[method.name] = result.url || result.styles;
        }
      } catch (error) {
        errors.push({ method: method.name, error: error.message });
      }
    }
    
    return {
      success: Object.keys(results).length > 0,
      styles: results,
      errors
    };
  }
}