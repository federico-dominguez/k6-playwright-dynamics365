/**
 * OData Query Builder for Dynamics 365 Web API
 *
 * Provides a fluent interface for constructing OData query strings.
 * Supports all common OData query options used in Dynamics 365.
 *
 * @module lib/helpers/odata-builder
 */

/** OData query options interface */
export interface ODataQueryOptions {
  /** Fields to select (e.g., ['firstname', 'lastname']) */
  select?: string[];
  /** OData filter expression (e.g., "statecode eq 0") */
  filter?: string;
  /** Order by expression (e.g., "lastname asc, firstname asc") */
  orderBy?: string;
  /** Maximum number of records to return */
  top?: number;
  /** Number of records to skip (for pagination) */
  skip?: number;
  /** Related entities to expand */
  expand?: string[] | ExpandOption[];
  /** Include total count in response */
  count?: boolean;
  /** Apply aggregation */
  apply?: string;
}

/** Expand option with nested query options */
export interface ExpandOption {
  /** Navigation property name */
  property: string;
  /** Nested select fields */
  select?: string[];
  /** Nested filter */
  filter?: string;
  /** Nested order by */
  orderBy?: string;
  /** Nested top */
  top?: number;
}

/**
 * OData Query Builder
 *
 * Provides static methods and fluent builder pattern for constructing OData queries.
 *
 * @example
 * // Static method
 * const query = ODataBuilder.build({
 *   select: ['firstname', 'lastname'],
 *   filter: "statecode eq 0",
 *   top: 50
 * });
 *
 * // Fluent builder
 * const query = new ODataBuilder()
 *   .select('firstname', 'lastname')
 *   .filter("statecode eq 0")
 *   .top(50)
 *   .build();
 */
export class ODataBuilder {
  private options: ODataQueryOptions = {};

  /**
   * Build query string from options object (static method)
   *
   * @param {ODataQueryOptions} options - Query options
   * @returns {string} OData query string (without leading ?)
   *
   * @example
   * const query = ODataBuilder.build({
   *   select: ['name', 'accountid'],
   *   filter: "statecode eq 0",
   *   orderBy: "name asc",
   *   top: 100
   * });
   * // Returns: $select=name,accountid&$filter=statecode%20eq%200&$orderby=name%20asc&$top=100
   */
  static build(options: ODataQueryOptions): string {
    const parts: string[] = [];

    if (options.select?.length) {
      parts.push(`$select=${options.select.join(',')}`);
    }

    if (options.filter) {
      // URL-encode the filter value to handle spaces, parentheses, quotes, etc.
      parts.push(`$filter=${encodeURIComponent(options.filter)}`);
    }

    if (options.orderBy) {
      parts.push(`$orderby=${encodeURIComponent(options.orderBy)}`);
    }

    if (options.top !== undefined) {
      parts.push(`$top=${options.top}`);
    }

    if (options.skip !== undefined) {
      parts.push(`$skip=${options.skip}`);
    }

    if (options.expand?.length) {
      const expandStr = ODataBuilder.buildExpand(options.expand);
      parts.push(`$expand=${encodeURIComponent(expandStr)}`);
    }

    if (options.count) {
      parts.push('$count=true');
    }

    if (options.apply) {
      parts.push(`$apply=${encodeURIComponent(options.apply)}`);
    }

    return parts.join('&');
  }

  /**
   * Build expand clause from expand options
   * @private
   */
  private static buildExpand(expand: string[] | ExpandOption[]): string {
    return expand.map(e => {
      if (typeof e === 'string') {
        return e;
      }

      // Nested expand with options
      const nestedParts: string[] = [];

      if (e.select?.length) {
        nestedParts.push(`$select=${e.select.join(',')}`);
      }
      if (e.filter) {
        nestedParts.push(`$filter=${e.filter}`);
      }
      if (e.orderBy) {
        nestedParts.push(`$orderby=${e.orderBy}`);
      }
      if (e.top !== undefined) {
        nestedParts.push(`$top=${e.top}`);
      }

      if (nestedParts.length) {
        return `${e.property}(${nestedParts.join(';')})`;
      }
      return e.property;
    }).join(',');
  }

  /**
   * Add select fields
   * @param {...string} fields - Field names to select
   * @returns {ODataBuilder} Builder instance for chaining
   */
  select(...fields: string[]): ODataBuilder {
    this.options.select = [...(this.options.select || []), ...fields];
    return this;
  }

  /**
   * Set filter expression
   * @param {string} expression - OData filter expression
   * @returns {ODataBuilder} Builder instance for chaining
   */
  filter(expression: string): ODataBuilder {
    this.options.filter = expression;
    return this;
  }

  /**
   * Add filter condition with AND operator
   * @param {string} expression - Additional filter expression
   * @returns {ODataBuilder} Builder instance for chaining
   */
  andFilter(expression: string): ODataBuilder {
    if (this.options.filter) {
      this.options.filter = `(${this.options.filter}) and (${expression})`;
    } else {
      this.options.filter = expression;
    }
    return this;
  }

  /**
   * Add filter condition with OR operator
   * @param {string} expression - Additional filter expression
   * @returns {ODataBuilder} Builder instance for chaining
   */
  orFilter(expression: string): ODataBuilder {
    if (this.options.filter) {
      this.options.filter = `(${this.options.filter}) or (${expression})`;
    } else {
      this.options.filter = expression;
    }
    return this;
  }

  /**
   * Set order by expression
   * @param {string} expression - Order by expression (e.g., "name asc")
   * @returns {ODataBuilder} Builder instance for chaining
   */
  orderBy(expression: string): ODataBuilder {
    this.options.orderBy = expression;
    return this;
  }

  /**
   * Set maximum number of records
   * @param {number} count - Maximum records to return
   * @returns {ODataBuilder} Builder instance for chaining
   */
  top(count: number): ODataBuilder {
    this.options.top = count;
    return this;
  }

  /**
   * Set number of records to skip
   * @param {number} count - Records to skip
   * @returns {ODataBuilder} Builder instance for chaining
   */
  skip(count: number): ODataBuilder {
    this.options.skip = count;
    return this;
  }

  /**
   * Add expand clause
   * @param {string | ExpandOption} expandOption - Navigation property or expand options
   * @returns {ODataBuilder} Builder instance for chaining
   */
  expand(expandOption: string | ExpandOption): ODataBuilder {
    if (!this.options.expand) {
      this.options.expand = [];
    }
    (this.options.expand as (string | ExpandOption)[]).push(expandOption);
    return this;
  }

  /**
   * Include total count in response
   * @param {boolean} include - Whether to include count
   * @returns {ODataBuilder} Builder instance for chaining
   */
  count(include: boolean = true): ODataBuilder {
    this.options.count = include;
    return this;
  }

  /**
   * Set apply aggregation
   * @param {string} expression - Apply expression
   * @returns {ODataBuilder} Builder instance for chaining
   */
  apply(expression: string): ODataBuilder {
    this.options.apply = expression;
    return this;
  }

  /**
   * Build the query string
   * @returns {string} OData query string (without leading ?)
   */
  build(): string {
    return ODataBuilder.build(this.options);
  }

  /**
   * Get current options object
   * @returns {ODataQueryOptions} Current query options
   */
  getOptions(): ODataQueryOptions {
    return { ...this.options };
  }

  /**
   * Reset builder to initial state
   * @returns {ODataBuilder} Builder instance for chaining
   */
  reset(): ODataBuilder {
    this.options = {};
    return this;
  }
}

// Common filter helpers
export const ODataFilters = {
  /**
   * Create equality filter
   * @param {string} field - Field name
   * @param {string | number | boolean} value - Value to compare
   * @returns {string} OData filter expression
   */
  eq(field: string, value: string | number | boolean): string {
    if (typeof value === 'string') {
      return `${field} eq '${value}'`;
    }
    return `${field} eq ${value}`;
  },

  /**
   * Create not equal filter
   * @param {string} field - Field name
   * @param {string | number | boolean} value - Value to compare
   * @returns {string} OData filter expression
   */
  ne(field: string, value: string | number | boolean): string {
    if (typeof value === 'string') {
      return `${field} ne '${value}'`;
    }
    return `${field} ne ${value}`;
  },

  /**
   * Create greater than filter
   * @param {string} field - Field name
   * @param {number} value - Value to compare
   * @returns {string} OData filter expression
   */
  gt(field: string, value: number): string {
    return `${field} gt ${value}`;
  },

  /**
   * Create greater than or equal filter
   * @param {string} field - Field name
   * @param {number} value - Value to compare
   * @returns {string} OData filter expression
   */
  ge(field: string, value: number): string {
    return `${field} ge ${value}`;
  },

  /**
   * Create less than filter
   * @param {string} field - Field name
   * @param {number} value - Value to compare
   * @returns {string} OData filter expression
   */
  lt(field: string, value: number): string {
    return `${field} lt ${value}`;
  },

  /**
   * Create less than or equal filter
   * @param {string} field - Field name
   * @param {number} value - Value to compare
   * @returns {string} OData filter expression
   */
  le(field: string, value: number): string {
    return `${field} le ${value}`;
  },

  /**
   * Create contains filter
   * @param {string} field - Field name
   * @param {string} value - Substring to search
   * @returns {string} OData filter expression
   */
  contains(field: string, value: string): string {
    return `contains(${field}, '${value}')`;
  },

  /**
   * Create starts with filter
   * @param {string} field - Field name
   * @param {string} value - Prefix to match
   * @returns {string} OData filter expression
   */
  startsWith(field: string, value: string): string {
    return `startswith(${field}, '${value}')`;
  },

  /**
   * Create ends with filter
   * @param {string} field - Field name
   * @param {string} value - Suffix to match
   * @returns {string} OData filter expression
   */
  endsWith(field: string, value: string): string {
    return `endswith(${field}, '${value}')`;
  },

  /**
   * Create null check filter
   * @param {string} field - Field name
   * @returns {string} OData filter expression
   */
  isNull(field: string): string {
    return `${field} eq null`;
  },

  /**
   * Create not null check filter
   * @param {string} field - Field name
   * @returns {string} OData filter expression
   */
  isNotNull(field: string): string {
    return `${field} ne null`;
  },

  /**
   * Create active records filter (statecode eq 0)
   * @returns {string} OData filter expression
   */
  active(): string {
    return 'statecode eq 0';
  },

  /**
   * Create inactive records filter (statecode eq 1)
   * @returns {string} OData filter expression
   */
  inactive(): string {
    return 'statecode eq 1';
  },

  /**
   * Combine filters with AND
   * @param {...string} filters - Filter expressions
   * @returns {string} Combined OData filter expression
   */
  and(...filters: string[]): string {
    return filters.map(f => `(${f})`).join(' and ');
  },

  /**
   * Combine filters with OR
   * @param {...string} filters - Filter expressions
   * @returns {string} Combined OData filter expression
   */
  or(...filters: string[]): string {
    return filters.map(f => `(${f})`).join(' or ');
  },

  /**
   * Negate a filter
   * @param {string} filter - Filter expression
   * @returns {string} Negated OData filter expression
   */
  not(filter: string): string {
    return `not (${filter})`;
  },
};
