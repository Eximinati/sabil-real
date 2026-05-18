export interface Reciter {
  id: number;
  name: string;
}

export const reciters: Reciter[] = [
  { id: 5, name: 'Mishary Rashid Alafasy' },
  { id: 7, name: 'Abdul Basit' },
  { id: 10, name: 'Mohamed Siddiq El-Minshawi' },
  { id: 11, name: 'Abdurrahman As-Sudais' },
  { id: 16, name: 'Mahmoud Khalil Al-Husary' },
];

export const defaultReciterId = 5;