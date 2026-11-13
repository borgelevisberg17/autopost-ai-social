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

if __name__ == '__main__':
    unittest.main()