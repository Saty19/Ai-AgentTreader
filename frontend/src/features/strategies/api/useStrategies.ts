import { useQuery } from '@tanstack/react-query';

export interface Strategy {
  name: string;
  description: string;
  indicators: any[];
}

const fetchStrategies = async (): Promise<Strategy[]> => {
  const response = await fetch('http://localhost:3000/api/strategies');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export const useStrategies = () => {
  return useQuery({
    queryKey: ['strategies'],
    queryFn: fetchStrategies,
  });
};
