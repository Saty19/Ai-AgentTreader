// Block templates and utilities for backend

export interface BlockTemplate {
  id: string;
  type: string;
  category: string;
  name: string;
  description: string;
}

// Mock function - returns empty array for now
// In a real implementation, this would return actual block templates
export function getAllBlockTemplates(): BlockTemplate[] {
  return [];
}

export function searchBlocks(query: string): BlockTemplate[] {
  const allBlocks = getAllBlockTemplates();
  return allBlocks.filter(block => 
    block.name.toLowerCase().includes(query.toLowerCase()) ||
    block.description.toLowerCase().includes(query.toLowerCase())
  );
}
