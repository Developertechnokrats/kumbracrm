export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          primary_color: string
          address: string | null
          phone: string | null
          email: string | null
          website: string | null
          data_region: string
          created_at: string
        }
      }
      profiles: {
        Row: {
          id: string
          company_id: string
          full_name: string | null
          email: string | null
          title: string | null
          role: 'super_admin' | 'admin' | 'manager' | 'broker' | 'viewer'
          created_at: string
          updated_at: string
        }
      }
      contacts: {
        Row: {
          id: string
          company_id: string
          lead_source: string | null
          status: string | null
          first_name: string | null
          middle_name: string | null
          last_name: string | null
          full_name: string | null
          title: string | null
          dob: string | null
          country_of_birth: string | null
          nationality: string | null
          phone1: string | null
          phone2: string | null
          email: string | null
          street_address: string | null
          city: string | null
          province: string | null
          postcode: string | null
          readiness: string | null
          ideal_term: string | null
          ideal_value: string | null
          ideal_payments: string | null
          ideal_interest: string | null
          ideal_currency: string | null
          ideal_range: any
          asset_classes: string[] | null
          liquid: number | null
          net_worth: number | null
          annual_income: number | null
          banks_with: string | null
          proof_of_address: boolean
          proof_of_id: boolean
          signature: boolean
          account_type: string | null
          dividend_bank: string | null
          dividend_account_number: string | null
          dividend_account_name: string | null
          assigned_to: string | null
          next_action: string | null
          last_conversation: string | null
          employment_status: string | null
          advisor: string | null
          investment_knowledge: string | null
          objective: string | null
          created_at: string
          updated_at: string
        }
      }
      products: {
        Row: {
          id: string
          company_id: string
          issuer_id: string | null
          product_type: 'bond' | 'fund' | 'pre_ipo' | 'gold'
          name: string
          currency: string
          min_investment: number | null
          term: string | null
          payment_frequency: string | null
          status: string
          created_at: string
          updated_at: string
        }
      }
    }
  }
}
