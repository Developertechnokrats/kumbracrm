import { createClient } from './supabase/server'

export type Entitlements = {
  has: (key: string) => boolean
  list: string[]
}

export async function getEntitlements(companyId: string): Promise<Entitlements> {
  const supabase = await createClient()

  const { data: sub } = await supabase
    .from('company_subscriptions')
    .select('id, plan_id, status')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .maybeSingle()

  if (!sub?.plan_id) {
    return {
      has: () => false,
      list: [],
    }
  }

  const { data: planFeats } = await supabase
    .from('plan_features')
    .select('features(key), limits')
    .eq('plan_id', sub.plan_id)

  const { data: overrides } = await supabase
    .from('company_feature_overrides')
    .select('features(key), enabled, limits')
    .eq('company_id', companyId)

  const enabled = new Set<string>()

  planFeats?.forEach((pf: any) => {
    if (pf.features?.key) {
      enabled.add(pf.features.key)
    }
  })

  overrides?.forEach((ov: any) => {
    if (ov.features?.key) {
      if (ov.enabled === false) {
        enabled.delete(ov.features.key)
      } else if (ov.enabled === true) {
        enabled.add(ov.features.key)
      }
    }
  })

  return {
    has: (key: string) => enabled.has(key),
    list: Array.from(enabled),
  }
}

export async function can(companyId: string, featureKey: string): Promise<boolean> {
  const ent = await getEntitlements(companyId)
  return ent.has(featureKey)
}
