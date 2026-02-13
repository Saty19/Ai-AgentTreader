import { useQuery } from '@tanstack/react-query';
import { config } from '../../../config';

export interface Strategy {
  name: string;
  description: string;
  indicators: any[];
}

const fetchStrategies = async (): Promise<Strategy[]> => {
  const response = await fetch(`${config.apiBaseUrl}/strategies`);
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
