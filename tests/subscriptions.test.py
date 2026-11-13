"""Live permission/rule checks. Run: python3 tests/subscriptions.test.py.
Requires the approved managed browser session; never prints credentials.
"""
import json
import os
import unittest
from pathlib import Path
import requests

class SubscriptionRules(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        session_path = Path.home() / '.cache/lovable-auth/session.json'
        if not session_path.exists():
            raise unittest.SkipTest('An approved authenticated session is required')
        session = json.loads(session_path.read_text())['session']
        values = {}
        for line in Path('.env').read_text().splitlines():
            if '=' in line:
                k, v = line.split('=', 1)
                values[k] = v.strip().strip('"')
        cls.url = values['VITE_SUPABASE_URL']
        cls.key = values['VITE_SUPABASE_PUBLISHABLE_KEY']
        cls.headers = {'apikey': cls.key, 'Authorization': 'Bearer ' + session['access_token']}
        overview = cls.rpc('platform_overview', {}).json()
        if not isinstance(overview, dict) or not overview.get('companies'):
            raise unittest.SkipTest('Platform administrator account required')
        cls.company = overview['companies'][0]['id']

    @classmethod
    def rpc(cls, name, body, anonymous=False):
        return requests.post(cls.url + '/rest/v1/rpc/' + name, json=body,
                             headers={'apikey': cls.key} if anonymous else cls.headers, timeout=30)

    def test_anonymous_cannot_read_platform_companies(self):
        self.assertGreaterEqual(self.rpc('platform_overview', {}, True).status_code, 400)

    def test_unsupported_feature_is_blocked_without_using_quota(self):
        before = self.rpc('company_entitlement', {'_company': self.company}).json()['ai_used']
        response = self.rpc('consume_company_ai', {'_company': self.company, '_feature': 'not_a_plan_feature'})
        self.assertGreaterEqual(response.status_code, 400)
        self.assertEqual(self.rpc('company_entitlement', {'_company': self.company}).json()['ai_used'], before)

    def test_temporary_plan_cannot_expire_in_the_past(self):
        before = self.rpc('company_entitlement', {'_company': self.company}).json()
        result = self.rpc('platform_manage', {'_action': 'grant', '_data': {'company_id': self.company, 'plan_id': 'pro', 'expires_at': '2020-01-01T00:00:00Z'}})
        self.assertGreaterEqual(result.status_code, 400)
        self.assertEqual(self.rpc('company_entitlement', {'_company': self.company}).json()['plan'], before['plan'])

    def test_coupon_requires_at_least_one_use(self):
        result = self.rpc('platform_manage', {'_action': 'coupon', '_data': {'code': 'INVALID-ZERO-USES', 'plan_id': 'basic', 'percent_off': 10, 'max_uses': 0, 'expires_at': '2099-01-01T00:00:00Z'}})
        self.assertGreaterEqual(result.status_code, 400)

    def test_coupon_discount_cannot_exceed_100_percent(self):
        result = self.rpc('platform_manage', {'_action': 'coupon', '_data': {'code': 'INVALID-DISCOUNT', 'plan_id': 'basic', 'percent_off': 101, 'max_uses': 1, 'expires_at': '2099-01-01T00:00:00Z'}})
        self.assertGreaterEqual(result.status_code, 400)

    def test_plan_limits_are_distinct(self):
        response = requests.get(self.url + '/rest/v1/subscription_plans?select=id,product_limit,monthly_ai_limit,features', headers=self.headers, timeout=30)
        self.assertEqual(response.status_code, 200)
        plans = {p['id']: p for p in response.json()}
        for plan, products, ai in [('free',25,10),('basic',500,200),('pro',5000,2000)]:
            with self.subTest(plan=plan):
                self.assertEqual(plans[plan]['product_limit'],products)
                self.assertEqual(plans[plan]['monthly_ai_limit'],ai)
        self.assertEqual(plans['free']['features'],['marketing'])
        self.assertEqual(plans['basic']['features'],['marketing','analytics'])
        self.assertEqual(plans['pro']['features'],['marketing','analytics','sales','whatsapp'])

    def test_credentials_are_not_readable_by_authenticated_user(self):
        response = requests.get(self.url + '/rest/v1/integration_credentials?select=id', headers=self.headers, timeout=30)
        self.assertGreaterEqual(response.status_code,400)

    def test_free_whatsapp_operation_is_blocked(self):
        overview = self.rpc('platform_overview', {}).json()
        free = next(c for c in overview['companies'] if c['entitlement']['plan']=='free')
        result = self.rpc('consume_company_ai', {'_company':free['id'],'_feature':'whatsapp'})
        self.assertGreaterEqual(result.status_code,400)

    def test_meta_diagnostic_does_not_expose_credentials(self):
        result = requests.post(self.url + '/functions/v1/integration-settings', headers=self.headers,
                               json={'action':'status'}, timeout=30)
        self.assertEqual(result.status_code,200)
        self.assertNotIn('credentials',result.json())
        self.assertNotIn('access_token',result.json())
        self.assertNotIn('app_secret',result.json())

    def test_company_cannot_save_shared_meta_credentials(self):
        result = requests.post(self.url + '/functions/v1/integration-settings', headers=self.headers,
                               json={'action':'save','company_id':self.company,'provider':'meta','credentials':{}}, timeout=30)
        self.assertEqual(result.status_code,403)

if __name__ == '__main__':
    unittest.main()