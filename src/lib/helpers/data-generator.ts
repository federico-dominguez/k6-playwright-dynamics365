/**
 * Test Data Generator for Dynamics 365 Entities
 *
 * Provides utilities for generating realistic test data.
 * Uses deterministic random generation with optional seeds for reproducibility.
 *
 * @module lib/helpers/data-generator
 */

/** Random number generator state */
let seed = Date.now();

/**
 * Set seed for reproducible random data generation
 * @param {number} newSeed - Seed value
 */
export function setSeed(newSeed: number): void {
  seed = newSeed;
}

/**
 * Simple seeded random number generator (Mulberry32)
 * @returns {number} Random number between 0 and 1
 */
function random(): number {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * Generate random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

/**
 * Pick random item from array
 * @param {T[]} array - Array to pick from
 * @returns {T} Random item
 */
export function randomItem<T>(array: T[]): T {
  return array[randomInt(0, array.length - 1)];
}

/**
 * Generate random boolean
 * @param {number} probability - Probability of true (0-1)
 * @returns {boolean} Random boolean
 */
export function randomBool(probability: number = 0.5): boolean {
  return random() < probability;
}

// Sample data arrays
const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Lisa', 'Daniel', 'Nancy',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
];

const companyNames = [
  'Acme', 'Global', 'United', 'First', 'National', 'Premier', 'Advanced', 'Dynamic',
  'Innovative', 'Strategic', 'Summit', 'Pacific', 'Atlantic', 'Northern', 'Southern',
  'Central', 'Western', 'Eastern', 'Modern', 'Classic', 'Elite', 'Prime', 'Alpha', 'Omega',
];

const companySuffixes = [
  'Corporation', 'Inc', 'LLC', 'Solutions', 'Industries', 'Technologies', 'Group',
  'Enterprises', 'Systems', 'Services', 'Partners', 'Associates', 'Holdings', 'International',
];

const domains = [
  'example.com', 'test.com', 'sample.org', 'demo.net', 'testdata.io', 'mockdata.com',
];

const streetNames = [
  'Main', 'Oak', 'Maple', 'Cedar', 'Pine', 'Elm', 'Washington', 'Park', 'Lake', 'Hill',
  'River', 'Spring', 'Valley', 'Forest', 'Sunset', 'Highland', 'Meadow', 'Grove', 'Union',
];

const streetSuffixes = ['St', 'Ave', 'Blvd', 'Dr', 'Ln', 'Rd', 'Way', 'Ct', 'Pl'];

const cities = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio',
  'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus',
  'Charlotte', 'Seattle', 'Denver', 'Boston', 'Nashville', 'Portland', 'Las Vegas', 'Miami',
];

const states = [
  { name: 'California', code: 'CA' },
  { name: 'Texas', code: 'TX' },
  { name: 'Florida', code: 'FL' },
  { name: 'New York', code: 'NY' },
  { name: 'Pennsylvania', code: 'PA' },
  { name: 'Illinois', code: 'IL' },
  { name: 'Ohio', code: 'OH' },
  { name: 'Georgia', code: 'GA' },
  { name: 'Washington', code: 'WA' },
  { name: 'Arizona', code: 'AZ' },
];

const jobTitles = [
  'CEO', 'CFO', 'CTO', 'COO', 'VP of Sales', 'VP of Marketing', 'Director of Operations',
  'Senior Manager', 'Project Manager', 'Account Manager', 'Sales Representative',
  'Marketing Specialist', 'Software Engineer', 'Data Analyst', 'Business Analyst',
  'Human Resources Manager', 'Financial Analyst', 'Operations Manager', 'Consultant',
];

const departments = [
  'Sales', 'Marketing', 'Finance', 'Human Resources', 'Operations', 'Engineering',
  'IT', 'Customer Service', 'Legal', 'Research & Development', 'Administration',
];

/**
 * Data Generator for creating test entities
 *
 * @example
 * const contact = DataGenerator.contact();
 * const account = DataGenerator.account();
 * const contactForAccount = DataGenerator.contact({ companyName: 'Acme Corp' });
 */
export const DataGenerator = {
  /**
   * Generate a random first name
   * @returns {string} Random first name
   */
  firstName(): string {
    return randomItem(firstNames);
  },

  /**
   * Generate a random last name
   * @returns {string} Random last name
   */
  lastName(): string {
    return randomItem(lastNames);
  },

  /**
   * Generate a full name
   * @returns {{ firstName: string; lastName: string; fullName: string }}
   */
  fullName(): { firstName: string; lastName: string; fullName: string } {
    const firstName = this.firstName();
    const lastName = this.lastName();
    return {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
    };
  },

  /**
   * Generate a random email address
   * @param {string} firstName - Optional first name
   * @param {string} lastName - Optional last name
   * @param {string} domain - Optional domain
   * @returns {string} Email address
   */
  email(firstName?: string, lastName?: string, domain?: string): string {
    const fn = (firstName || this.firstName()).toLowerCase();
    const ln = (lastName || this.lastName()).toLowerCase();
    const d = domain || randomItem(domains);
    const separator = randomItem(['.', '_', '']);
    const suffix = randomBool(0.3) ? randomInt(1, 99) : '';
    return `${fn}${separator}${ln}${suffix}@${d}`;
  },

  /**
   * Generate a random phone number
   * @param {string} format - Phone format ('us', 'international')
   * @returns {string} Phone number
   */
  phone(format: 'us' | 'international' = 'us'): string {
    const areaCode = randomInt(200, 999);
    const exchange = randomInt(200, 999);
    const subscriber = randomInt(1000, 9999);

    if (format === 'international') {
      return `+1 ${areaCode} ${exchange} ${subscriber}`;
    }
    return `(${areaCode}) ${exchange}-${subscriber}`;
  },

  /**
   * Generate a random company name
   * @returns {string} Company name
   */
  companyName(): string {
    const name = randomItem(companyNames);
    const suffix = randomItem(companySuffixes);
    return `${name} ${suffix}`;
  },

  /**
   * Generate a random job title
   * @returns {string} Job title
   */
  jobTitle(): string {
    return randomItem(jobTitles);
  },

  /**
   * Generate a random department
   * @returns {string} Department name
   */
  department(): string {
    return randomItem(departments);
  },

  /**
   * Generate a random street address
   * @returns {string} Street address
   */
  streetAddress(): string {
    const number = randomInt(1, 9999);
    const street = randomItem(streetNames);
    const suffix = randomItem(streetSuffixes);
    return `${number} ${street} ${suffix}`;
  },

  /**
   * Generate a random city
   * @returns {string} City name
   */
  city(): string {
    return randomItem(cities);
  },

  /**
   * Generate a random state
   * @returns {{ name: string; code: string }} State object
   */
  state(): { name: string; code: string } {
    return randomItem(states);
  },

  /**
   * Generate a random ZIP code
   * @returns {string} ZIP code
   */
  zipCode(): string {
    return String(randomInt(10000, 99999));
  },

  /**
   * Generate a full address
   * @returns {object} Address object
   */
  address(): {
    street: string;
    city: string;
    state: string;
    stateCode: string;
    zipCode: string;
    country: string;
  } {
    const stateInfo = this.state();
    return {
      street: this.streetAddress(),
      city: this.city(),
      state: stateInfo.name,
      stateCode: stateInfo.code,
      zipCode: this.zipCode(),
      country: 'USA',
    };
  },

  /**
   * Generate a random website URL
   * @param {string} companyName - Optional company name for domain
   * @returns {string} Website URL
   */
  website(companyName?: string): string {
    const name = (companyName || this.companyName())
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    return `https://www.${name}.com`;
  },

  /**
   * Generate a random description/notes
   * @param {number} maxLength - Maximum length
   * @returns {string} Random text
   */
  description(maxLength: number = 200): string {
    const templates = [
      'Important client for the {department} department.',
      'Follow up required regarding {topic}.',
      'Key contact for {topic} initiatives.',
      'Priority account - handle with care.',
      'Scheduled for quarterly review.',
      'Potential opportunity for {topic}.',
      'Active engagement ongoing.',
    ];
    const topics = ['Q1 goals', 'new projects', 'expansion', 'partnership', 'renewal', 'upgrade'];

    let text = randomItem(templates)
      .replace('{department}', this.department())
      .replace('{topic}', randomItem(topics));

    return text.substring(0, maxLength);
  },

  /**
   * Generate a unique identifier with prefix
   * @param {string} prefix - Prefix for the identifier
   * @returns {string} Unique identifier
   */
  uniqueId(prefix: string = 'test'): string {
    const timestamp = Date.now().toString(36);
    const randomPart = randomInt(1000, 9999).toString(36);
    return `${prefix}_${timestamp}_${randomPart}`;
  },

  /**
   * Generate a random date within a range
   * @param {Date} start - Start date
   * @param {Date} end - End date
   * @returns {Date} Random date
   */
  date(start: Date = new Date(2020, 0, 1), end: Date = new Date()): Date {
    const startTime = start.getTime();
    const endTime = end.getTime();
    const randomTime = startTime + random() * (endTime - startTime);
    return new Date(randomTime);
  },

  /**
   * Generate a random monetary amount
   * @param {number} min - Minimum amount
   * @param {number} max - Maximum amount
   * @param {number} decimals - Decimal places
   * @returns {number} Random amount
   */
  money(min: number = 100, max: number = 100000, decimals: number = 2): number {
    const amount = min + random() * (max - min);
    return Number(amount.toFixed(decimals));
  },

  // ============================================
  // Entity-specific generators
  // ============================================

  /**
   * Generate Dynamics 365 Contact entity data
   * @param {object} overrides - Override default values
   * @returns {object} Contact entity data
   */
  contact(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    const name = this.fullName();
    const address = this.address();
    const email = this.email(name.firstName, name.lastName);

    return {
      firstname: name.firstName,
      lastname: name.lastName,
      emailaddress1: email,
      telephone1: this.phone(),
      mobilephone: this.phone(),
      jobtitle: this.jobTitle(),
      department: this.department(),
      address1_line1: address.street,
      address1_city: address.city,
      address1_stateorprovince: address.stateCode,
      address1_postalcode: address.zipCode,
      address1_country: address.country,
      description: this.description(),
      ...overrides,
    };
  },

  /**
   * Generate Dynamics 365 Account entity data
   * @param {object} overrides - Override default values
   * @returns {object} Account entity data
   */
  account(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    const companyName = (overrides.name as string) || this.companyName();
    const address = this.address();

    return {
      name: companyName,
      emailaddress1: this.email(companyName.split(' ')[0], 'info'),
      telephone1: this.phone(),
      websiteurl: this.website(companyName),
      address1_line1: address.street,
      address1_city: address.city,
      address1_stateorprovince: address.stateCode,
      address1_postalcode: address.zipCode,
      address1_country: address.country,
      description: this.description(),
      revenue: this.money(10000, 10000000),
      numberofemployees: randomInt(10, 10000),
      ...overrides,
    };
  },

  /**
   * Generate Dynamics 365 Lead entity data
   * @param {object} overrides - Override default values
   * @returns {object} Lead entity data
   */
  lead(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    const name = this.fullName();
    const company = this.companyName();
    const email = this.email(name.firstName, name.lastName);

    return {
      firstname: name.firstName,
      lastname: name.lastName,
      emailaddress1: email,
      telephone1: this.phone(),
      companyname: company,
      jobtitle: this.jobTitle(),
      subject: `Lead: ${name.fullName} from ${company}`,
      description: this.description(),
      leadsourcecode: randomInt(1, 10), // Lead source option set
      budgetamount: this.money(5000, 500000),
      ...overrides,
    };
  },

  /**
   * Generate Dynamics 365 Opportunity entity data
   * @param {object} overrides - Override default values
   * @returns {object} Opportunity entity data
   */
  opportunity(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    const topics = [
      'Software Implementation', 'Consulting Services', 'Hardware Upgrade',
      'Annual Subscription', 'Professional Services', 'Licensing Deal',
      'Digital Transformation', 'Cloud Migration', 'Support Contract',
    ];

    return {
      name: randomItem(topics),
      description: this.description(),
      estimatedvalue: this.money(10000, 1000000),
      estimatedclosedate: this.date(new Date(), new Date(Date.now() + 180 * 24 * 60 * 60 * 1000))
        .toISOString()
        .split('T')[0],
      closeprobability: randomInt(10, 90),
      ...overrides,
    };
  },

  /**
   * Generate Dynamics 365 Case (incident) entity data
   * @param {object} overrides - Override default values
   * @returns {object} Case entity data
   */
  case(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    const caseTypes = [
      'Technical Support', 'Billing Issue', 'Product Inquiry',
      'Service Request', 'Complaint', 'Feature Request',
    ];

    return {
      title: `${randomItem(caseTypes)} - ${this.uniqueId('CASE')}`,
      description: this.description(),
      prioritycode: randomInt(1, 3), // 1=High, 2=Normal, 3=Low
      casetypecode: randomInt(1, 3), // Question, Problem, Request
      ...overrides,
    };
  },

  /**
   * Generate multiple entities of the same type
   * @param {Function} generator - Generator function
   * @param {number} count - Number of entities to generate
   * @param {object} overrides - Override values for all entities
   * @returns {Array} Array of generated entities
   */
  many<T>(
    generator: (overrides?: Record<string, unknown>) => T,
    count: number,
    overrides: Record<string, unknown> = {}
  ): T[] {
    return Array.from({ length: count }, () => generator.call(this, overrides));
  },
};

export default DataGenerator;
