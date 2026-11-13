// The three staff accounts the demo back end accepts (any other ID returns a 403).
// `id` is the username (matches the leaderboard CSV). `customerId` is what the API takes
// (the CSV's uid column; it never changes). Names and initials are display only.
export interface DemoUser {
  id: string;
  customerId: number;
  /** Sent to the NetAppsPay SDK as the customer email. */
  email: string;
  name: string;
  initials: string;
}

export const DEMO_USER_PROFILES: DemoUser[] = [
  { id: 'masud', customerId: 3, email: 'abdrahmanoladimeji02@gmail.com', name: 'Masud Hashim', initials: 'MH' },
  { id: 'edwino', customerId: 19, email: 'edwinokoro@gmail.com', name: 'Edwin Okoro', initials: 'EO' },
  { id: 'chimuamandao', customerId: 28008, email: 'chimuamandaogidi@gmail.com', name: 'Chimuamanda Ogidi', initials: 'CO' },
];
