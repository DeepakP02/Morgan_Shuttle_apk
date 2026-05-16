import { format, addDays } from 'date-fns';

// Moving destinations to initial state so Admin can manage them via Context
export const initialDestinations = [
  'Morgan Campus',
  'Station Mont-Tremblant',
  'IGA',
  'Super C',
  'Bourassa',
  'Maxi',
  'Other'
];

const generateDailyTrips = (baseDate) => {
  const schedule = [
    { t: '06:20', o: 'Morgan Campus', d: 'Station Mont-Tremblant' },
    { t: '06:40', o: 'Station Mont-Tremblant', d: 'Morgan Campus' },
    { t: '07:00', o: 'Morgan Campus', d: 'Station Mont-Tremblant' },
    { t: '07:20', o: 'Station Mont-Tremblant', d: 'Morgan Campus' },
    { t: '07:40', o: 'Morgan Campus', d: 'Station Mont-Tremblant' },
    { t: '08:00', o: 'Station Mont-Tremblant', d: 'Morgan Campus' },
    { t: '08:20', o: 'Morgan Campus', d: 'Station Mont-Tremblant' },
    { t: '08:40', o: 'Station Mont-Tremblant', d: 'Morgan Campus' },
    { t: '10:20', o: 'Morgan Campus', d: 'Station Mont-Tremblant' },
    { t: '10:40', o: 'Station Mont-Tremblant', d: 'Morgan Campus' },
    { t: '12:00', o: 'Morgan Campus', d: 'Station Mont-Tremblant' },
    { t: '12:20', o: 'Station Mont-Tremblant', d: 'Morgan Campus' },
    { t: '15:20', o: 'Station Mont-Tremblant', d: 'Morgan Campus' },
    { t: '15:40', o: 'Morgan Campus', d: 'Station Mont-Tremblant' },
    { t: '16:00', o: 'Station Mont-Tremblant', d: 'Morgan Campus' },
    { t: '16:20', o: 'Morgan Campus', d: 'Station Mont-Tremblant' },
    { t: '16:40', o: 'Station Mont-Tremblant', d: 'Morgan Campus' },
    { t: '17:00', o: 'Morgan Campus', d: 'Station Mont-Tremblant' },
    { t: '17:20', o: 'Station Mont-Tremblant', d: 'Morgan Campus' },
    { t: '18:20', o: 'Morgan Campus', d: 'Station Mont-Tremblant' },
    { t: '18:40', o: 'Station Mont-Tremblant', d: 'Morgan Campus' },
    { t: '21:20', o: 'Morgan Campus', d: 'Station Mont-Tremblant' },
    { t: '21:40', o: 'Station Mont-Tremblant', d: 'Morgan Campus' },
    { t: '23:00', o: 'Morgan Campus', d: 'Station Mont-Tremblant' },
    { t: '23:20', o: 'Station Mont-Tremblant', d: 'Morgan Campus' },
    { t: '23:45', o: 'Morgan Campus', d: 'Station Mont-Tremblant' },
  ];

  return schedule.map((item, index) => ({
    id: `${format(baseDate, 'yyyyMMdd')}-${index}`,
    time: item.t,
    date: format(baseDate, 'yyyy-MM-dd'),
    origin: item.o,
    destination: item.d,
    seats_total: 7,
    seats_remaining: 7, 
    status: 'scheduled',
  }));
};

const allTrips = [];
for (let i = 0; i < 7; i++) {
  allTrips.push(...generateDailyTrips(addDays(new Date(), i)));
}

export const initialTrips = allTrips;

export const initialRequests = [
  { 
    id: 'req-1', 
    tenant_name: 'Kiaan Patel', 
    date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), 
    time: '14:00', 
    origin: 'IGA', 
    destination: 'Morgan Campus', 
    passengers: 2, 
    status: 'pending', 
    source: 'tenant', 
    notes: 'Weekly groceries' 
  },
];

export const initialFuelLogs = [];
export const initialMaintLogs = [];
